import type { Attachment, AttachmentOwnerKind } from '../types';
import type { SearchHit } from '../apps/types';
import * as engine from './offline/engine';
import { ATTACHMENTS_SPEC } from './offline/specs';
import { matches } from './search';

/**
 * The attachments of `kind` whose name mentions `query`, each shown under the
 * entry it belongs to: `owners` maps an entry's id to its title and page, and
 * an attachment of an entry not in it is left out.
 */
export async function searchAttachments(
  kind: AttachmentOwnerKind,
  owners: Map<string, { title: string; to: string }>,
  query: string,
): Promise<SearchHit[]> {
  const attachments = await engine.listVisible<Attachment>(ATTACHMENTS_SPEC);
  return attachments.flatMap((attachment) => {
    const owner = attachment.owner_kind === kind ? owners.get(attachment.owner_id) : undefined;
    return owner && matches(attachment.name, query)
      ? [{ title: attachment.name, subtitle: owner.title, to: `${owner.to}/${attachment.id}` }]
      : [];
  });
}
