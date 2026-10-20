import type { TablerIcon } from '@tabler/icons-react';
import LinkRow from './LinkRow';
import ModalDialog from './ModalDialog';
import SectionLabel from './SectionLabel';

/** One answer to the question: what it is called, and the icon it is drawn
 *  with in its list, if it has one. */
interface KindOption<Kind extends string> {
  kind: Kind;
  label: string;
  icon?: TablerIcon;
  /** Said in the muted colour: an answer that is not one of the listed
   *  entries, set apart below them. */
  muted?: boolean;
}

interface KindPickDialogProps<Kind extends string> {
  /** What is being asked about: the title just typed. Left out where the
   *  answers alone say it, the bar still showing it behind. */
  title?: string;
  /** What is asked, over the answers. */
  question?: string;
  options: KindOption<Kind>[];
  onPick: (kind: Kind) => void;
  /** Called when the question is dismissed without an answer. */
  onClose: () => void;
}

/**
 * The question an add bar's + asks before a row can exist: what kind of entry
 * it is, for one whose kind is chosen at birth and never afterwards, or where
 * on the list it goes. What was typed, the question over the answers, and one
 * row per answer. Dismissed, it leaves the title where it was typed.
 */
export default function KindPickDialog<Kind extends string>({
  title,
  question = '¿Qué es?',
  options,
  onPick,
  onClose,
}: KindPickDialogProps<Kind>) {
  return (
    <ModalDialog onClose={onClose} layout="confirm" label={question}>
      <div className="flex flex-col gap-2">
        {/* What is being asked about, in the weight of the text around it: it
            says what is being talked about, not what is being asked. */}
        {title !== undefined && <p className="truncate text-lg text-on-surface">{title}</p>}
        <SectionLabel>{question}</SectionLabel>
        <ul className="-mb-1 [&>li:last-child]:border-b-0">
          {options.map(({ kind, label, icon: Icon, muted }) => (
            <LinkRow
              key={kind}
              title={label}
              muted={muted}
              leading={Icon && <Icon size={20} stroke={1.5} className="shrink-0 text-muted" />}
              onClick={() => onPick(kind)}
            />
          ))}
        </ul>
      </div>
    </ModalDialog>
  );
}
