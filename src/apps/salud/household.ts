// =============================================================================
// Who Salud can show on this device: the signed-in member and the pets. The
// other person is never among them — their rows never reach this device
// either, by the server's policy — and nothing here decides that: it only
// puts the household in the order the chips are drawn in.
// =============================================================================
import type { Member } from '../../lib/offline/specs';

/** A member nobody signs in as. */
export function isPet(member: Member): boolean {
  return member.email === null;
}

/** The pets by id: what names a pet's row wherever it is drawn away from the
 *  list. A member's own rows say nothing, so they are not here. */
export function petNames(members: readonly Member[]): Map<string, string> {
  return new Map(members.filter(isPet).map((member) => [member.id, member.display_name]));
}

/** The members this device may show: the signed-in one first, found by the
 *  session's email, then the pets in the order the store keeps them. The
 *  other person is never among them — their rows never reach this device
 *  either. */
export function viewableMembers(members: readonly Member[], sessionEmail: string | null): Member[] {
  const own = sessionEmail === null ? null : sessionEmail.toLowerCase();
  const self = members.find(
    (member) => member.email !== null && member.email.toLowerCase() === own,
  );
  return [...(self ? [self] : []), ...members.filter(isPet)];
}
