// @ts-check

/** @file  This is a module for use with swingset.CoreEval. */

import { E } from '@endo/far';
import { baseCharacters, baseItems } from './base-inventory.js';

import '@agoric/governance/src/types-ambient.js';
import { deeplyFulfilled } from '@endo/marshal';

const KREAD_LABEL = 'KREAd';

const contractInfo = {
  storagePath: 'kread',
  instanceName: 'kread',
};

const { Fail } = assert;

const fail = (reason) => {
  throw reason;
};

/** @typedef {import('@agoric/deploy-script-support/src/coreProposalBehavior.js').BootstrapPowers} BootstrapPowers */

const reserveThenGetNamePaths = async (nameAdmin, paths) => {
  /**
   * @param {ERef<import('@agoric/vats').NameAdmin>} nextAdmin
   * @param {string[]} path
   */
  const nextPath = async (nextAdmin, path) => {
    const [nextName, ...rest] = path;
    assert.typeof(nextName, 'string');

    // Ensure we wait for the next name until it exists.
    await E(nextAdmin).reserve(nextName);

    if (rest.length === 0) {
      // Now return the readonly lookup of the name.
      const nameHub = E(nextAdmin).readonly();
      return E(nameHub).lookup(nextName);
    }

    // Wait until the next admin is resolved.
    const restAdmin = await E(nextAdmin).lookupAdmin(nextName);
    return nextPath(restAdmin, rest);
  };

  return Promise.all(
    paths.map(async (path) => {
      Array.isArray(path) || Fail`path ${path} is not an array`;
      return nextPath(nameAdmin, path);
    }),
  );
};

const CONTRACT_ELECTORATE = 'Electorate';
const ParamTypes = {
  INVITATION: 'invitation',
};

/**
 * @template {GovernableStartFn} SF
 * @param {{
 *   zoe: ERef<ZoeService>;
 *   governedContractInstallation: ERef<Installation<SF>>;
 *   issuerKeywordRecord?: IssuerKeywordRecord;
 *   terms: Record<string, unknown>;
 *   privateArgs: any; // TODO: connect with Installation type
 *   label: string;
 * }} zoeArgs
 * @param {{
 *   governedParams: Record<string, unknown>;
 *   timer: ERef<import('@agoric/time/src/types').TimerService>;
 *   contractGovernor: ERef<Installation>;
 *   committeeCreator: import('@agoric/inter-protocol/src/proposals/econ-behaviors.js').EconomyBootstrapPowers['consume']['economicCommitteeCreatorFacet'];
 * }} govArgs
 * @returns {Promise<GovernanceFacetKit<SF>>}
 */
const startGovernedInstance = async (
  {
    zoe,
    governedContractInstallation,
    issuerKeywordRecord,
    terms,
    privateArgs,
    label,
  },
  { governedParams, timer, contractGovernor, committeeCreator },
) => {
  const poserInvitationP = E(committeeCreator).getPoserInvitation();
  const [initialPoserInvitation, electorateInvitationAmount] =
    await Promise.all([
      poserInvitationP,
      E(E(zoe).getInvitationIssuer()).getAmountOf(poserInvitationP),
    ]);

  const governorTerms = await deeplyFulfilled(
    harden({
      timer,
      governedContractInstallation,
      governed: {
        terms: {
          ...terms,
          governedParams: {
            [CONTRACT_ELECTORATE]: {
              type: ParamTypes.INVITATION,
              value: electorateInvitationAmount,
            },
            ...governedParams,
          },
        },
        issuerKeywordRecord,
        label,
      },
    }),
  );
  const governorFacets = await E(zoe).startInstance(
    contractGovernor,
    {},
    governorTerms,
    harden({
      economicCommitteeCreatorFacet: committeeCreator,
      governed: {
        ...privateArgs,
        initialPoserInvitation,
      },
    }),
    `${label}-governor`,
  );
  const [instance, publicFacet, creatorFacet, adminFacet] = await Promise.all([
    E(governorFacets.creatorFacet).getInstance(),
    E(governorFacets.creatorFacet).getPublicFacet(),
    E(governorFacets.creatorFacet).getCreatorFacet(),
    E(governorFacets.creatorFacet).getAdminFacet(),
  ]);
  /** @type {GovernanceFacetKit<SF>} */
  const facets = harden({
    instance,
    publicFacet,
    governor: governorFacets.instance,
    creatorFacet,
    adminFacet,
    governorCreatorFacet: governorFacets.creatorFacet,
    governorAdminFacet: governorFacets.adminFacet,
  });
  return facets;
};

/**
 * Execute a proposal to start a contract that publishes the KREAd dapp.
 * Starts the contractGoverner contract which itself starts the KREAd instance.
 *
 * See also:
 * BLDer DAO governance using arbitrary code injection: swingset.CoreEval
 * https://community.agoric.com/t/blder-dao-governance-using-arbitrary-code-injection-swingset-coreeval/99
 *
 * @param {BootstrapPowers} powers
 */
// TODO rename to startKreadGovernor
export const startKread = async (powers) => {
  const {
    consume: {
      zoe,
      chainTimerService,
      chainStorage,
      board,
      kreadCommitteeCreatorFacet,
      namesByAddressAdmin,
    },
    produce: { kreadKit },
    brand: {
      produce: {
        KREAdCHARACTER: produceCharacterBrand,
        KREAdITEM: produceItemBrand,
      },
    },
    issuer: {
      consume: { IST: istIssuerP },
      produce: {
        KREAdCHARACTER: produceCharacterIssuer,
        KREAdITEM: produceItemIssuer,
      },
    },
    installation: {
      consume: { kreadKit: installation, contractGovernor },
    },
    instance: {
      produce: { [contractInfo.instanceName]: produceKreadInstance },
    },
  } = powers;

  // XX These should be looked up in start-kread-script and passed in
  const royaltyAddr = 'agoric1d33wj6vgjfdaefs6qzda8np8af6qfdzc433dsu';
  const platformFeeAddr = 'agoric1d33wj6vgjfdaefs6qzda8np8af6qfdzc433dsu';

  const [royaltyDepositFacet] = await reserveThenGetNamePaths(
    namesByAddressAdmin,
    [[royaltyAddr, 'depositFacet']],
  );
  const [platformFeeDepositFacet] = await reserveThenGetNamePaths(
    namesByAddressAdmin,
    [[platformFeeAddr, 'depositFacet']],
  );

  const royaltyRate = {
    numerator: 10n,
    denominator: 100n,
  };
  const platformFeeRate = {
    numerator: 3n,
    denominator: 100n,
  };

  const mintRoyaltyRate = {
    numerator: 85n,
    denominator: 100n,
  };
  const mintPlatformFeeRate = {
    numerator: 15n,
    denominator: 100n,
  };

  const storageNode = E(chainStorage).makeChildNode(contractInfo.storagePath);
  const kreadPowers = {
    storageNode,
    marshaller: await E(board).getReadonlyMarshaller(),
  };

  const terms = harden({
    royaltyRate,
    platformFeeRate,
    mintRoyaltyRate,
    mintPlatformFeeRate,
    royaltyDepositFacet,
    platformFeeDepositFacet,
    mintFee: 30000000n,
    assetNames: {
      character: 'KREAdCHARACTER',
      item: 'KREAdITEM',
    },
    minUncommonRating: 20,
  });

  const clock = await E(chainTimerService).getClock();
  const kreadConfig = harden({
    clock,
    seed: 303,
  });

  const privateArgs = harden({ powers: kreadPowers, ...kreadConfig });

  const facets = await startGovernedInstance(
    {
      zoe,
      governedContractInstallation: installation,
      issuerKeywordRecord: harden({ Money: await istIssuerP }),
      terms,
      privateArgs,
      label: KREAD_LABEL,
    },
    {
      governedParams: {},
      timer: chainTimerService,
      contractGovernor,
      committeeCreator: kreadCommitteeCreatorFacet,
    },
  );

  // FIXME make sure this ends up in durable storage
  kreadKit.resolve(
    harden({
      ...facets,
      label: KREAD_LABEL,
      privateArgs,
    }),
  );

  const { creatorFacet, instance } = facets;
  const {
    issuers: { KREAdCHARACTER: characterIssuer, KREAdITEM: itemIssuer },
    brands: { KREAdCHARACTER: characterBrand, KREAdITEM: itemBrand },
  } = await E(zoe).getTerms(instance);

  await Promise.all([
    E(creatorFacet).initializeBaseAssets(baseCharacters, baseItems),
    E(creatorFacet).initializeMetrics(),
    E(creatorFacet).initializeCharacterNamesEntries(),
    E(creatorFacet).reviveMarketExitSubscribers(),
  ]);

  produceKreadInstance.resolve(instance);

  // resolving these publishes into agoricNames for `issuer` and `brand`
  produceCharacterIssuer.resolve(characterIssuer);
  produceCharacterBrand.resolve(characterBrand);
  produceItemIssuer.resolve(itemIssuer);
  produceItemBrand.resolve(itemBrand);

  console.log('CONTRACT INIT SUCCESS!');
};
harden(startKread);

export const getManifestForStartKread = async (
  { restoreRef },
  { kreadKitRef },
) => ({
  manifest: {
    [startKread.name]: {
      consume: {
        board: true,
        zoe: true,
        chainTimerService: true,
        chainStorage: true,
        kreadCommitteeCreatorFacet: true,
        agoricNames: true,
        namesByAddressAdmin: true,
      },
      instance: {
        produce: { [contractInfo.instanceName]: true },
      },
      installation: {
        consume: {
          kreadKit: true,
          contractGovernor: true,
        },
      },
      brand: {
        produce: {
          KREAdCHARACTER: true,
          KREAdITEM: true,
        },
      },
      issuer: {
        consume: { IST: true },
        produce: {
          KREAdCHARACTER: true,
          KREAdITEM: true,
        },
      },
      produce: { kreadKit: true },
    },
  },
  installations: {
    kreadKit: restoreRef(kreadKitRef),
  },
});
