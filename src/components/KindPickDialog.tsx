import type { TablerIcon } from '@tabler/icons-react';
import LinkRow from './LinkRow';
import ModalDialog from './ModalDialog';

/** One answer to the question: what it is called, and the icon it is drawn
 *  with in its list, if it has one. */
export interface KindOption<Kind extends string> {
  kind: Kind;
  label: string;
  icon?: TablerIcon;
}

interface KindPickDialogProps<Kind extends string> {
  /** What is being asked about: the title just typed. */
  title: string;
  options: KindOption<Kind>[];
  onPick: (kind: Kind) => void;
  /** Called when the question is dismissed without an answer. */
  onClose: () => void;
}

/**
 * The question an add bar's + asks before a row can exist, for an entry whose
 * kind is chosen at birth and never afterwards: the typed title, and one row
 * per kind. Dismissed, it leaves the title where it was typed.
 */
export default function KindPickDialog<Kind extends string>({
  title,
  options,
  onPick,
  onClose,
}: KindPickDialogProps<Kind>) {
  return (
    <ModalDialog onClose={onClose} layout="confirm">
      <div className="flex flex-col gap-2">
        <p className="truncate font-medium text-on-surface">{title}</p>
        <ul className="-mb-1 [&>li:last-child]:border-b-0">
          {options.map(({ kind, label, icon: Icon }) => (
            <LinkRow
              key={kind}
              title={label}
              leading={Icon && <Icon size={20} stroke={1.5} className="shrink-0 text-muted" />}
              onClick={() => onPick(kind)}
            />
          ))}
        </ul>
      </div>
    </ModalDialog>
  );
}
