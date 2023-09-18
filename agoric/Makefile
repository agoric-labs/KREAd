SDK_PATH =
COSMIC_SWINGSET_PATH =
VATS_PATH =
KEPLR_ADDRESS =
KEPLR_ADDRESS2 =
FEE_ADDRESS = agoric1d33wj6vgjfdaefs6qzda8np8af6qfdzc433dsu
KREAD_REPO =
EVAL_PERMIT =
EVAL_CODE =
EVAL_CLEAN =

include Makefile.paths.local

chain-reset:
	agoric start local-chain --reset --verbose

solo0-reset:
	agoric start local-solo 8000 --reset --verbose

solo1-reset:
	agoric start local-solo 8001 --reset --verbose

chain:
	agoric start local-chain --verbose

solo0:
	agoric start local-solo 8000 --verbose

solo1:
	agoric start local-solo 8001 --verbose

wallet0:
	agoric open --hostport=localhost:8000 --no-browser

wallet1:
	agoric open --hostport=localhost:8001 --no-browser

deploy:
	agoric deploy contract/kread-deploy-contract.js api/kread-deploy-api.js

install-kread:
	agoric run contract/src/proposal/kread-committee-script.js
	agoric publish --node 127.0.0.1:26657 /Users/chris/.agoric/cache/b1-610ae18f1dcefba0d443196aaf853550d26a69704113ba5cfcea8f811a0c17fa21a98cd485c25b403bf22d629c3e161d4b42e16fa5b1c77aee5457919aad74c0.json \
	--chain-id agoriclocal --home $(COSMIC_SWINGSET_PATH)/t1/8000;
	agoric publish --node 127.0.0.1:26657 /Users/chris/.agoric/cache/b1-0c780c20b02a7e3a10126ca84ce76c50bb34744d9621c83e230ec977b85a8d21ab8f88842fe89edf3a219008edb375178a9dc54f4867ad17463bc0a05470e5ee.json \
	--chain-id agoriclocal --home $(COSMIC_SWINGSET_PATH)/t1/8000;
#	agd tx swingset install-bundle @/Users/chris/.agoric/cache/b1-.json  \
#       --from gov1 --keyring-backend=test --gas=auto --chain-id=agoriclocal -bblock --yes
#	agd tx gov submit-proposal swingset-core-eval kread-invite-committee-permit.json kread-invite-committee.js \
#		--title="Install Kread Committee" --description="Evaluate kread-invite-committee.js" --deposit=1000000ubld \
#		--gas=auto --gas-adjustment=1.2
#	agoric run contract/src/proposal/start-kread-script.js
#	agd tx gov submit-proposal swingset-core-eval kread-invite-committee-permit.json kread-invite-committee.js \
#		--title="Enable <something>" --description="Evaluate kread-invite-committee.js" --deposit=1000000ubld \
#		--gas=auto --gas-adjustment=1.2
#	agd tx gov submit-proposal swingset-core-eval kread-invite-committee-permit.json kread-invite-committee.js \
#		--title="Enable <something>" --description="Evaluate kread-invite-committee.js" --deposit=1000000ubld \
#		--gas=auto --gas-adjustment=1.

kread-bundle:
	cd $(VATS_PATH); \
    yarn bundle-source --cache-json bundles/ ${KREAD_REPO} kread; \
	agoric publish --node 127.0.0.1:26657 bundles/bundle-kread.json --chain-id agoriclocal --home ../cosmic-swingset/t1/8000; \

local-testnet:
	cd $(COSMIC_SWINGSET_PATH); \
	make scenario2-setup BASE_PORT=8000 NUM_SOLOS=0; \
	make scenario2-run-chain; \

client-local-testnet:
	cd $(COSMIC_SWINGSET_PATH); \
	make scenario2-run-client BASE_PORT=8000; \

provision-account:
	cd $(COSMIC_SWINGSET_PATH); \
	make fund-provision-pool provision-acct ACCT_ADDR=$(KEPLR_ADDRESS) \

provision-account-2:
	cd $(COSMIC_SWINGSET_PATH); \
	make fund-provision-pool provision-acct ACCT_ADDR=$(KEPLR_ADDRESS2) \

provision-fee-collector:
	cd $(COSMIC_SWINGSET_PATH); \
	make fund-provision-pool provision-acct ACCT_ADDR=$(FEE_ADDRESS) \

fund-account:
	cd $(COSMIC_SWINGSET_PATH); \
	make fund-acct ACCT_ADDR=$(KEPLR_ADDRESS) FUNDS=1000000000000uist; \
	make fund-acct ACCT_ADDR=$(KEPLR_ADDRESS) FUNDS=1000000000000ubld; \

fund-pool:
	cd $(COSMIC_SWINGSET_PATH); \
	make fund-provision-pool \

fund-account-atom:
	cd $(COSMIC_SWINGSET_PATH); \
	make fund-acct ACCT_ADDR=$(KEPLR_ADDRESS) FUNDS=100000000ibc/toyatom; \

proposal:
	cd $(COSMIC_SWINGSET_PATH); \
	make scenario2-core-eval EVAL_PERMIT=$(EVAL_PERMIT) EVAL_CLEAN=$(EVAL_CLEAN) scenario2-vote \

proposal-2:
	cd $(COSMIC_SWINGSET_PATH); \
	make scenario2-core-eval EVAL_PERMIT=$(EVAL_PERMIT) EVAL_CLEAN=$(EVAL_CLEAN) scenario2-vote VOTE_PROPOSAL=2 \

# note if you made changes to the contract code you must
# copy the resulting hash from kread-bundle into the proposal
# before running make proposal
bootstrap:
	make provision-account; \
	make fund-account; \
	make kread-bundle; \
	make proposal; \

fund+provision:
	make provision-account; \
	make fund-account; \
