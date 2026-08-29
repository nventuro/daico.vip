import type { ButtonHTMLAttributes } from 'react';
import { Link } from 'react-router-dom';
import type { TablerIcon } from '@tabler/icons-react';

interface IconButtonBase {
  /** What it does, for a screen reader and on hover: an icon alone never says. */
  label: string;
  /** What hovering says, when there is more to add than the name — why the
   *  control is disabled, say. The name a screen reader reads stays `label`. */
  title?: string;
  icon: TablerIcon;
  size?: number;
  /** `surface`: on a plain screen; `band`: on a full-bleed colour, where a
   *  hover can only be told by fading. */
  tone?: 'surface' | 'band';
  className?: string;
}

/** Either a link somewhere or a button that does something — never both, so
 *  a button's own attributes can't be handed to a link and quietly dropped. */
type IconButtonProps =
  | (IconButtonBase & { to: string })
  | (IconButtonBase & { to?: undefined } & ButtonHTMLAttributes<HTMLButtonElement>);

const TONE_CLASS = {
  surface: 'text-muted transition-colors hover:bg-border-subtle hover:text-on-surface',
  band: 'transition-opacity hover:opacity-80',
};

/** A control that is only its icon: a target of its own, always named. */
export default function IconButton({
  label,
  title = label,
  icon: Icon,
  size = 20,
  to,
  tone = 'surface',
  className = 'p-2',
  ...rest
}: IconButtonProps) {
  const look = `flex shrink-0 items-center ${TONE_CLASS[tone]} ${className}`;
  const glyph = <Icon size={size} stroke={1.75} />;

  if (to !== undefined) {
    return (
      <Link to={to} aria-label={label} title={title} className={look}>
        {glyph}
      </Link>
    );
  }
  return (
    <button type="button" aria-label={label} title={title} className={look} {...rest}>
      {glyph}
    </button>
  );
}
