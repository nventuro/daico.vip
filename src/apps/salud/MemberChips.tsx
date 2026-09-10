import type { Member } from '../../lib/offline/specs';
import Chip from '../../components/Chip';

interface MemberChipsProps {
  /** The members this device may show, in the order they are drawn. */
  members: Member[];
  /** The id of the member being viewed. */
  value: string;
  onChange: (id: string) => void;
}

/** The row over the list that says whose health it shows: one chip per
 *  member, one chosen. Nothing else on it — no + and no count: the household
 *  is written by hand, never here. */
export default function MemberChips({ members, value, onChange }: MemberChipsProps) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="De quién">
      {members.map((member) => (
        <Chip key={member.id} selected={member.id === value} onClick={() => onChange(member.id)}>
          {member.display_name}
        </Chip>
      ))}
    </div>
  );
}
