# Benchmarking the mint-character operation

This runs a benchmark of the KREAd "Mint Character" operation:

```
% cd agoric
% yarn
% cd contract
% vi test/bench-minting.js   # edit COUNT= at top to control loop count
% LOCKDOWN_OPTIONS='{"__hardenTaming__":"unsafe"}' node test/bench-minting.js | tee bench.out
% ls profile.cpuprofile
```

The `bench.out` file contains `console.time()` -style elapsed-time measurements of the major phases. The `profile.cpuprofile` trace contains a CPU sampling dataset which can be rendered by the Chrome DevTools viewer.

To view the profile / flamegraph:

* in Chrome, open chrome://inspect/#devices , then follow the link named "Open dedicated DevTools for Node"
* on the window that opens, choose the (rightmost) "Performance" tab
* click the "Load profile..." button (4th icon from the left, shaped like an upwards-pointing arrow above a shallow bucket)
* navigate to your local directory and choose the `profile.cpuprofile` file

https://github.com/Agoric/agoric-sdk/issues/8862 contains more discussion and analysis.

## Changes in this branch

This branch is derived from the same `KREAd-rc0` tag which was installed on the Agoric mainnet, plus the following changes:

* patch-package change to `@agoric/internal/src/storage-test-utils.js`, to change `makeMockChainStorageRoot()` to pass an options bag through to its internal `makeFakeStorageKit` call
  * `makeFakeStorageKit` defaults to `sequence: true`,  which switches chain-storage to `append` every update instead of overwrite, which adds O(n^2) overhead that does not match real-world usage
* change `agoric/contract/test/bootstrap.js` to pass `sequence: false` for that problem
  * also add a configurable number of BaseCharacters, so the extra minting has new ones to draw from
* changes to `agoric/contract/src/kreadKit.js`:
  * `await` many promises that were previously "fire-and-forget", to increase accuracy of CPU profile attribution (reduce overlap)
  * add stalls (40x `await null`s) after not-well-synchronized calls, also to reduce overlap
  * add `console.time()`/`console.timeEnd()` -based elapsed-time measurements of major operation steps
* change `agoric/contract/src/utils.js` to remove a distracting console.log
* change `package.json` to add `@endo/promise-kit` and `patch-pacakge`
* add the main `test/bench-minting.js` script

## What mint-character does

The `makeMintCharacterInvitation` handler is broken down into the following major pieces:

* create two new seats, one for fees, another named `inventorySeat` to hold the new character's initial items and the "shadow character")
  * there is a third "user" seat, which comes from the user who claimed the invitation
* mint the "primary character" to the user's seat
* mint the "shadow character" to the `inventorySeat`
* mint three Items to the `inventorySeat`
* transfer royalty/platform fees from the user seat to the internal deposit facets
* exit the user seat and the fee-transfer seat
* update metrics and data feeds

The "shadow character" is a character description record that is just like the primary character but with a different `keyId:` integer. The user gets one, and the `inventorySeat` gets the other. The `equip()` and `unequip()` offers swap the two. Every minted character has an `inventorySeat`, these seats are never exited, and every `inventorySeat` has one of the two character records allocated to it at all times (in addition to the Item amounts).

## What bench-minting.js does

The benchmark program is in `agoric/contract/test/bench-minting.js` . It was derived from the `--| MINT - Expected flow` test function in `test-minting.js`.

The benchmark script performs `COUNT` loops (controlled by a `const COUNT =` at the top of the file). Each loop does:

* create an invitation by calling `makeMintCharacterInvitation`
* claim the invitation with `zoe.offer`
* wait for the resulting seat to exit
* deposit the payouts (i.e. the new character) into a Purse

The elapsed-time numbers are emitted for all loops. The profiler is enabled only on the final loop, and is configured to sample every 1us (although it only seems to achieve 7-15us most of the time).

On my local machine, `COUNT = 800` takes about ten minutes to run, and last loop takes about 550ms. Profiling seems to add 10-20% to the runtime of that last loop, so it may be useful to look at the elapsed time numbers from the next-to-last loop as well.

## What is expensive, what is an artifact

The specific code that we've found to be expensive is when Zoe manipulates its `localPooledPurse` for the `KREAd CHARACTER` Brand. The shadow characters allocated to the collection of `inventorySeat`s are all held by a single shared Purse on the Zoe side, so it contains COUNT records, each of which has a dozen fields and about 500 bytes of data. It takes significant time to marshal this Purse's virtual-object `state` record (serialize/deserialize into the vatstore DB), and to perform `stateShape` checks on both operations. It is even more expensive to add a new character record (during the deposit pprtion of `zoe.mintAndDeposit`), to remove a record (during the `withdraw` that happens when the seat is exited), and to do the `isGTE` check just before that `withdraw`. We also see significant time spent in the typeGuard checks that preceed each function call. A lot of time is spent in `passStyleOf` checks, probably because of the large number of small records involved.

The three expensive calls worth investigating have stacks that start with:

* `mintAndDeposit()` (the first time, when the primary character is minted and allocated to the user seat)
* `mintAndDeposit()` (the second time, when the shadow character is minted and allocated to `inventorySeat`)
* `exit()` (exiting the user seat, which withdraws a Payment from the pooled purse)

The performance problems on-chain are apparent (to the order of 40 seconds of execution time) when there are 380 records in this purse. With all the sources of overhead on mainnet workers, this means the benchmark environment (at least when run on my laptop) is roughly 200x faster than mainnet.

The test environment differs from the on-chain mainnet behavior in ways that affect apparent performance in both directions:

* The fake-vat test environment simulates the vatstore (swing-store) with a Map, which implements `vatstoreGetNextKey` badly (via `ensureSorted`, when compared to the real chain's SQLite swing-store), which appears as a long time spent in `getRandomBaseIndex` at the beginning of the loop. This is an artifact that does not need further investigation.
* At the end of the loop, the benchmark code deposits all minted characters in a single user purse, which incurs an additional copy of the same expensive `add` operation that the contract uses internally. On the real chain, most users have only a few characters, so the only non-trivially-sized Purse is Zoe's `localPooledPurse`. The profiling trace for this last `deposit` is basically the same as the one during the two `zoe.mintAndDeposit` calls that are the real issue, so it's not worth investigating that part of the trace either.
* The fake-vat environment does not use a real liveslots `dispatch.deliver()` call, so there is no end-of-crank flush of the VOM state cache, which means the benchmark environment never needs to load the Purse state back into RAM, so it never needs to call `unserialize` on the large state. The real chain must load it in on every crank that invokes methods on the Purse. This makes the benchmark-mint.js time look better than it ought to: it will be missing this deserialization time. I expect this to be about the same as the serialization time (which takes place during the `set()` call at the end of both `mintAndDeposit` and `withdraw`, and which spends a lot of time in `checkStatePropertyValue`).
* On the real chain, XS is generally slower than V8, and syscalls have messaging overhead. However there are not very many syscalls, only a 100 or so, making this difference less significant.
* The chain roughly operates at the speed of the slowest validator, and the machine you run the benchmark on is probably faster.
* XS has a native `harden()` implementation, which is faster than the emulated version that Endo must create under V8. To compensate for this, we run the benchmark with `LOCKDOWN_OPTIONS='{"__hardenTaming__":"unsafe"}'`, which replaces `harden()` with a NOP. This might overcompensate, because XS's `harden()` is not free, and there are a lot of small records that it needs to harden.

Finally, the profile runtime is affected by the V8 GC pauses that occur at random intervals (however these are clearly visible on the CPU profile data).
