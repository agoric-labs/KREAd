/* global process */
import { makeHelpers } from '@agoric/deploy-script-support';

import { getManifestForInviteCommittee } from './kread-committee-proposal.js';

// Build proposal for sim-chain etc.
/** @type {import('@agoric/deploy-script-support/src/externalTypes.js').ProposalBuilder} */
export const defaultProposalBuilder = async (
  { publishRef, install },
  options = {},
) => {
  const {
    KREAD_COMMITTEE_ADDRESSES = process.env.KREAD_COMMITTEE_ADDRESSES,
    committeeName = process.env.KREAD_COMMITTEE_NAME,
    voterAddresses = JSON.parse(KREAD_COMMITTEE_ADDRESSES),
  } = options;

  console.log(`SCRIPT`, voterAddresses, committeeName);
  assert(voterAddresses, 'KREAD_COMMITTEE_ADDRESSES is required');

  return harden({
    sourceSpec: './kread-committee-proposal.js',
    getManifestCall: [
      getManifestForInviteCommittee.name,
      {
        voterAddresses,
        committeeName,
        kreadCommitteeCharterRef: publishRef(
          install(
            '../kreadCommitteeCharter.js',
            '../bundles/bundle-kreadCommitteeCharter.js',
            {
              persist: true,
            },
          ),
        ),
      },
    ],
  });
};

export default async (homeP, endowments) => {
  const { writeCoreProposal } = await makeHelpers(homeP, endowments);
  await writeCoreProposal('kread-invite-committee', defaultProposalBuilder);
};
