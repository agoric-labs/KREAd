/* global process */
import { makeHelpers } from '@agoric/deploy-script-support';

import { getManifestForStartKread } from './start-kread-proposal.js';

// Build proposal for sim-chain etc.
/** @type {import('@agoric/deploy-script-support/src/externalTypes.js').ProposalBuilder} */
export const defaultProposalBuilder = async (
  { publishRef, install },
  options = {},
) => {
  return harden({
    sourceSpec: './start-kread-proposal.js',
    getManifestCall: [getManifestForStartKread.name, {}],
  });
};

export default async (homeP, endowments) => {
  const { writeCoreProposal } = await makeHelpers(homeP, endowments);
  await writeCoreProposal('kread-invite-committee', defaultProposalBuilder);
};
