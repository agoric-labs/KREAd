// @ts-check

/** @file  This is a module for use with swingset.CoreEval. */

import {E} from '@endo/far';
import { defaultCharacters, defaultItems } from './chain-storage-proposal.js';

const contractInfo = {
  storagePath: 'kread',
  instanceName: 'kread',
  // see discussion of publish-bundle and bundleID
  // from Dec 14 office hours
  // https://github.com/Agoric/agoric-sdk/issues/6454#issuecomment-1351949397
  bundleID:
    'b1-eb9ca74ef1c31f74f95ddb0ee117575faf55b854d701033d0a8e6b52af9550b4081891aa5329f88fb877de6354c2f668b5b31f185e8c2613e1b1f572f6494439',
};

const fail = (reason) => {
  throw reason;
};

/** @typedef {import('@agoric/deploy-script-support/src/coreProposalBehavior.js').BootstrapPowers} BootstrapPowers */
/** @typedef {import('@agoric/governance/src/types-ambient.js').GovernanceFacetKit} GovernanceFacetKit */

/**
 * Generalized from basic-behaviors.js to take an arbitrary committee.
 *
 * @template {GovernableStartFn} SF
 * @param {BootstrapPowers} powers
 * @param {{object}} kreadConfig
 * @returns {Promise<GovernanceFacetKit<SF>>}
 */
const startGovernedInstance = async ({
  zone,
  consume: {
    zoe,
    timer,
    contractGovernor,
    chainStorage,
    board,
    kreadCommitteeCreatorFacet,
    agoricNames,
  },
  produce: { kreadKit },
}, { kreadConfig, }) => {
  const poserInvitationP = E(kreadCommitteeCreatorFacet).getPoserInvitation();
  const [initialPoserInvitation, electorateInvitationAmount] =
    await Promise.all([
      poserInvitationP,
      E(E(zoe).getInvitationIssuer()).getAmountOf(poserInvitationP),
    ]);

  const contractKits = zone.mapStore('KreadContractKits');

  const chainStorageSettled =
    (await chainStorage) || fail(Error('no chainStorage - sim chain?'));
  const storageNode = E(chainStorageSettled).makeChildNode(
    contractInfo.storagePath,
  );
  const marshaller = await E(board).getReadonlyMarshaller();
  const kreadPowers = { storageNode, marshaller };
  const clock = await E(chainTimerService).getClock();

  const istIssuer = await E(agoricNames).lookup('issuer', 'IST');
  const installation = await E(zoe).installBundleID(contractInfo.bundleID);

  const governorTerms =
    harden({
      timer,
      governedContractInstallation: installation,
      governed: {
        terms: {
          governedParams: {
            Electorate: {
              type: 'invitation',
              value: electorateInvitationAmount,
            },
          },
        },
        issuerKeywordRecord: harden({ Money: istIssuer }),
        label: 'KREAd',
      },
    },
  );

  const privateArgs = harden({ powers: kreadPowers, ...kreadConfig });

  const g = await  E(zoe).startInstance(
    contractGovernor,
    {},
    governorTerms,
    harden({
      committeeCreatorFacet,
      governed: {
        ...privateArgs,
        initialPoserInvitation,
      },
    }),
    `${label}-governor`,
  );

  const [instance, publicFacet, creatorFacet, adminFacet] = await Promise.all([
    E(g.creatorFacet).getInstance(),
    E(g.creatorFacet).getPublicFacet(),
    E(g.creatorFacet).getCreatorFacet(),
    E(g.creatorFacet).getAdminFacet(),
  ]);

  kreadKit.resolve(
    harden({
      label: 'KREAd',
      instance,
      publicFacet,
      creatorFacet,
      adminFacet,

      governor: g.instance,
      governorCreatorFacet: g.creatorFacet,
      governorAdminFacet: g.adminFacet,
      privateArgs,
    }),
  );

  return { publicFacet, creatorFacet, instance };
};

/**
 * Execute a proposal to start a contract that publishes the KREAd dapp.
 *
 * See also:
 * BLDer DAO governance using arbitrary code injection: swingset.CoreEval
 * https://community.agoric.com/t/blder-dao-governance-using-arbitrary-code-injection-swingset-coreeval/99
 *
 * @param {BootstrapPowers} powers
 */
const executeProposal = async powers => {
  const {
    consume: { board, agoricNamesAdmin },
    instance: {
      produce: { [contractInfo.instanceName]: kread },
    },
  } = powers;

  const kreadConfig = harden({
    defaultCharacters,
    defaultItems,
    clock,
    seed: 303,
  });

  const { publicFacet, creatorFacet, instance } = await startGovernedInstance(
    powers,
    { kreadConfig },
  );

  // Get board ids for instance and assets
  const boardId = await E(board).getId(instance);
  const {
    character: { issuer: characterIssuer, brand: characterBrand },
    item: { issuer: itemIssuer, brand: itemBrand },
    payment: { issuer: tokenIssuer, brand: tokenBrand },
  } = await E(publicFacet).getTokenInfo();

  const [
    CHARACTER_BRAND_BOARD_ID,
    CHARACTER_ISSUER_BOARD_ID,
    ITEM_BRAND_BOARD_ID,
    ITEM_ISSUER_BOARD_ID,
    TOKEN_BRAND_BOARD_ID,
    TOKEN_ISSUER_BOARD_ID,
  ] = await Promise.all([
    E(board).getId(characterBrand),
    E(board).getId(characterIssuer),
    E(board).getId(itemBrand),
    E(board).getId(itemIssuer),
    E(board).getId(tokenBrand),
    E(board).getId(tokenIssuer),
  ]);

  const assetBoardIds = {
    character: {
      issuer: CHARACTER_ISSUER_BOARD_ID,
      brand: CHARACTER_BRAND_BOARD_ID,
    },
    item: { issuer: ITEM_ISSUER_BOARD_ID, brand: ITEM_BRAND_BOARD_ID },
    paymentFT: { issuer: TOKEN_ISSUER_BOARD_ID, brand: TOKEN_BRAND_BOARD_ID },
  };

  await E(creatorFacet).publishKreadInfo(
    boardId,
    CHARACTER_BRAND_BOARD_ID,
    CHARACTER_ISSUER_BOARD_ID,
    ITEM_BRAND_BOARD_ID,
    ITEM_ISSUER_BOARD_ID,
    TOKEN_BRAND_BOARD_ID,
    TOKEN_ISSUER_BOARD_ID,
  );

  await E(creatorFacet).initializeMetrics();

  // TODO Get the most recent state of metrics from the storage node and send it to the contract
  // const data = {};
  // const restoreMetricsInvitation = await E(
  //   creatorFacet,
  // ).makeRestoreMetricsInvitation();
  // await E(zoe).offer(restoreMetricsInvitation, {}, {}, data);

  // Log board ids for use in frontend constants
  console.log(`KREAD BOARD ID: ${boardId}`);
  for (const [key, value] of Object.entries(assetBoardIds)) {
    console.log(`${key.toUpperCase()} BRAND BOARD ID: ${value.brand}`);
    console.log(`${key.toUpperCase()} ISSUER BOARD ID: ${value.issuer}`);
  }

  // Share instance widely via E(agoricNames).lookup('instance', <instance name>)
  kread.resolve(instance);

  const kindAdmin = (kind) => E(agoricNamesAdmin).lookupAdmin(kind);

  await E(kindAdmin('issuer')).update('KREAdCHARACTER', characterIssuer);
  await E(kindAdmin('brand')).update('KREAdCHARACTER', characterBrand);

  await E(kindAdmin('issuer')).update('KREAdITEM', itemIssuer);
  await E(kindAdmin('brand')).update('KREAdITEM', itemBrand);

  console.log('ASSETS ADDED TO AGORIC NAMES');
  // Share instance widely via E(agoricNames).lookup('instance', <instance name>)
};
harden(executeProposal);

export const getManifestForStartKread = async () => ({
  manifest: {
    [executeProposal.name]: {
      zone: true,
      consume: {
        chainTimerService: true,
        board: true,
        chainStorage: true,
        zoe: true,
        agoricNamesAdmin: true,
        agoricNames: true,
        diagnostics: true,
        kreadCommitteeCreatorFacet: true,
      },
      produce: { kreadKit: true },
      instance: {
        produce: { kread: true }
      },
    }
  }
});
