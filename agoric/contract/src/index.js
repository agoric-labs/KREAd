/* eslint-disable no-undef */
// @ts-check
import '@agoric/zoe/exported';

import { AmountMath, AssetKind } from '@agoric/ertp';
import { M } from '@agoric/store';
import { provideAll } from '@agoric/zoe/src/contractSupport/durability.js';
import { prepareRecorderKitMakers } from '@agoric/zoe/src/contractSupport/recorder.js';
import { makeRatio } from '@agoric/zoe/src/contractSupport/ratio.js';
import { InvitationShape } from '@agoric/zoe/src/typeGuards.js';
import { handleParamGovernance } from '@agoric/governance';

import { prepareKreadKit } from './kreadKit.js';
import { RatioObject } from './type-guards.js';

/**
 * This contract handles the mint of KREAd characters,
 * along with its corresponding item inventories and keys.
 * It also allows for equiping and unequiping items to
 * and from the inventory, using a token as access
 */

/**
 * @typedef {import('@agoric/vat-data').Baggage} Baggage
 *
 * @typedef {import('@agoric/time/src/types').Clock} Clock
 */

/** @type {ContractMeta} */
export const meta = {
  privateArgsShape: M.splitRecord({
    initialPoserInvitation: InvitationShape,
    seed: M.number(),
    clock: M.eref(M.remotable('Clock')),
    powers: {
      storageNode: M.eref(M.remotable('StorageNode')),
      marshaller: M.eref(M.remotable('Marshaller')),
    },
  }),
  customTermsShape: M.splitRecord({
    royaltyRate: {
      numerator: M.lte(100n),
      denominator: M.eq(100n),
    },
    platformFeeRate: {
      numerator: M.lte(100n),
      denominator: M.eq(100n),
    },
    mintFee: M.nat(),
    mintRoyaltyRate: {
      numerator: M.lte(100n),
      denominator: M.eq(100n),
    },
    mintPlatformFeeRate: {
      numerator: M.lte(100n),
      denominator: M.eq(100n),
    },
    royaltyDepositFacet: M.any(),
    platformFeeDepositFacet: M.any(),
    paymentBrand: M.eref(M.remotable('Brand')),
    assetNames: M.splitRecord({ character: M.string(), item: M.string() }),
  }),
};
harden(meta);

/**
 * @param {ZCF<GovernanceTerms<{}>>} zcf
 * @param {{
 *   seed: number
 *   powers: { storageNode: StorageNode, marshaller: Marshaller },
 *   clock: Clock
 *   defaultCharacters: object[],
 *   defaultItems: object[],
 *   initialPoserInvitation: Invitation
 *   powers: { storageNode: StorageNode, marshaller: Marshaller }
 * }} privateArgs
 *
 * @param {Baggage} baggage
 */
export const start = async (zcf, privateArgs, baggage) => {
  /**
   * @type {{
   *   paymentBrand: Brand
   *   mintFee: bigint,
   *   royaltyRate: RatioObject,
   *   platformFeeRate: RatioObject,
   *   mintRoyaltyRate: RatioObject,
   *   mintPlatformFeeRate: RatioObject,
   *   royaltyDepositFacet: DepositFacet,
   *   platformFeeDepositFacet: DepositFacet,
   *   assetNames: { character: string, item: string },
   * }}
   */
  const terms = zcf.getTerms();

  // TODO: move to proposal
  const assetNames = terms.assetNames;

  const storageNodePaths = {
    infoKit: 'info',
    characterKit: 'character',
    itemKit: 'item',
    marketCharacterKit: 'market-characters',
    marketItemKit: 'market-items',
    marketCharacterMetricsKit: 'market-character-metrics',
    marketItemMetricsKit: 'market-item-metrics',
  };

  const { makeGovernorFacet } = await handleParamGovernance(
    zcf,
    privateArgs.initialPoserInvitation,
    {},
  );

  // Setting up the mint capabilities here in the prepare function, as discussed with Turadg
  // durability is not a concern with these, and defining them here, passing on what's needed
  // ensures that the capabilities are where they need to be
  const { characterMint, itemMint } = await provideAll(baggage, {
    characterMint: () =>
      zcf.makeZCFMint(assetNames.character, AssetKind.COPY_BAG),
    itemMint: () => zcf.makeZCFMint(assetNames.item, AssetKind.COPY_BAG),
  });

  const characterIssuerRecord = characterMint.getIssuerRecord();
  const itemIssuerRecord = itemMint.getIssuerRecord();

  const { powers, clock, seed } = privateArgs;

  const {
    mintFee,
    royaltyRate,
    platformFeeRate,
    mintRoyaltyRate,
    mintPlatformFeeRate,
    royaltyDepositFacet,
    platformFeeDepositFacet,
    paymentBrand,
  } = terms;

  const { makeRecorderKit } = prepareRecorderKitMakers(
    baggage,
    powers.marshaller,
  );

  const mintFeeAmount = AmountMath.make(paymentBrand, mintFee);
  const mintRoyaltyRateRatio = makeRatio(
    mintRoyaltyRate.numerator,
    paymentBrand,
    mintRoyaltyRate.denominator,
    paymentBrand,
  );
  const mintPlatformFeeRatio = makeRatio(
    mintPlatformFeeRate.numerator,
    paymentBrand,
    mintPlatformFeeRate.denominator,
    paymentBrand,
  );
  const royaltyRateRatio = makeRatio(
    royaltyRate.numerator,
    paymentBrand,
    royaltyRate.denominator,
    paymentBrand,
  );
  const platformFeeRatio = makeRatio(
    platformFeeRate.numerator,
    paymentBrand,
    platformFeeRate.denominator,
    paymentBrand,
  );

  const kreadKit = await harden(
    prepareKreadKit(
      baggage,
      zcf,
      {
        seed,
        mintFeeAmount,
        royaltyRate: royaltyRateRatio,
        platformFeeRate: platformFeeRatio,
        mintRoyaltyRate: mintRoyaltyRateRatio,
        mintPlatformFeeRate: mintPlatformFeeRatio,
        royaltyDepositFacet,
        platformFeeDepositFacet,
        paymentBrand,
      },
      harden({
        characterIssuerRecord,
        characterMint,
        itemIssuerRecord,
        itemMint,
        clock,
        storageNode: powers.storageNode,
        makeRecorderKit,
        storageNodePaths,
      }),
    ),
  );

  return harden({
    creatorFacet: makeGovernorFacet(kreadKit.creator),
    // no governed parameters, so no need to augment.
    publicFacet: kreadKit.public,
  });
};

harden(start);
