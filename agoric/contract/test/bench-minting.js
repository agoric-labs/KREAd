import '@endo/init/pre-bundle-source.js';

import '@agoric/zoe/tools/prepare-test-env.js';

import { E } from '@endo/eventual-send';
import { AmountMath } from '@agoric/ertp';
import { bootstrapContext } from './bootstrap.js';
import { flow } from './flow.js';
import { makeKreadUser } from './make-user.js';
import { makeCopyBag } from '@agoric/store';

import { performance } from 'node:perf_hooks';
import { Session } from 'node:inspector';
import fs from 'node:fs';

const COUNT = 801;

// XS has a faster (native) harden() than V8, so to avoid penalizing
// it too much, run this like:
//
// LOCKDOWN_OPTIONS='{"__hardenTaming__":"unsafe"}' node test/bench-minting.js

async function setup() {
  const {
    zoe,
    contractAssets,
    assets,
    purses,
    publicFacet,
    paymentAsset,
    creatorFacet,
  } = await bootstrapContext({ COUNT });

  const alice = makeKreadUser('alice', {
    character: contractAssets.character.issuer.makeEmptyPurse(),
    item: contractAssets.item.issuer.makeEmptyPurse(),
    payment: paymentAsset.issuerMockIST.makeEmptyPurse(),
  });
  const payout = paymentAsset.mintMockIST.mintPayment(
    AmountMath.make(paymentAsset.brandMockIST, harden(100000000000n)),
  );
  alice.depositPayment(payout);

  const context = {
    publicFacet,
    contractAssets,
    assets,
    purses,
    zoe,
    paymentAsset,
    users: { alice },
    creatorFacet,
  };
  return context
}

async function do_one(context, i) {
  const start = performance.now() / 1000;
  /** @type {Bootstrap} */
  const {
    publicFacet,
    purses,
    paymentAsset,
    users: { alice },
    zoe,
  } = context;
  const { message, give, offerArgs: oa } = flow.mintCharacter.expected;
  const offerArgs = {...oa, name: `TestCharacter-${i}` };

  console.time(` i=${i} make invitation`);
  const mintCharacterInvitation = await E(
    publicFacet,
  ).makeMintCharacterInvitation();
  console.timeEnd(` i=${i} make invitation`);
  const priceAmount = AmountMath.make(paymentAsset.brandMockIST, give.Price);

  const proposal = harden({
    give: { Price: priceAmount }, // isn't this weak? contract could return nothing? -warner
  });

  const payment = { Price: alice.withdrawPayment(priceAmount) };

  console.time(` i=${i} offer`);
  const userSeat = await E(zoe).offer(
    mintCharacterInvitation,
    proposal,
    payment,
    offerArgs,
  );
  console.timeEnd(` i=${i} offer`);

  console.time(` i=${i} getOfferResult`);
  const result = await E(userSeat).getOfferResult();
  console.timeEnd(` i=${i} getOfferResult`);
  assert.equal(result, message, 'Offer returns success message');

  //const characters = await E(publicFacet).getCharacters();

  console.time(` i=${i} getPayout`);
  const payout = await E(userSeat).getPayout('Asset');
  console.timeEnd(` i=${i} getPayout`);
  console.time(` i=${i} deposit`);
  await purses.character.deposit(payout);
  console.timeEnd(` i=${i} deposit`);
  const finish = performance.now() / 1000;
  return finish - start;
}

import { makePromiseKit } from '@endo/promise-kit';

async function run() {
  const context = await setup();
  console.log(`-- setup done`);
  //console.log(`-- waiting for debugger`);
  //debugger;
  const session = new Session();
  session.connect();
  const session_post = (...args) => {
    const pk = makePromiseKit();
    session.post(...args, (err, res) => {
      if (err) {
        pk.reject(err);
      } else {
        pk.resolve(res);
      }
    });
    return pk.promise;
  };

  console.log(`-- loop starting`);
  for (let i=0; i< COUNT; i++) {
    //console.log(`-- loop i=${i}`);
    if (i===COUNT-1) {
      console.log(`--enabling profiling`);
      await session_post("Profiler.enable");
      // default is to sample every 1.33ms
      await session_post("Profiler.setSamplingInterval", { interval: 1 }); // us
      await session_post("Profiler.start");
    }
    console.time(`i=${i}`);
    let elapsed = await do_one(context, i);
    console.timeEnd(`i=${i}`);
    //console.log(`loop,${i},${elapsed}`);
  }

  const { profile } = await session_post("Profiler.stop");
  fs.writeFileSync('./profile.cpuprofile', JSON.stringify(profile));
  session.disconnect();
}

run().catch(err => console.log(`err`, err));

