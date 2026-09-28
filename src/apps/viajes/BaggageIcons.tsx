import { CARRY_ON_ICON, CHECKED_BAG_ICON } from './kinds';
import { baggageLabel } from './labels';

interface BaggageIconsProps {
  carryOn: number | null;
  checked: number | null;
}

/** A flight's luggage beside its title: a glyph per piece, the cabin's
 *  first, and no number — two suitcases read as two at a glance. Nothing at
 *  all for a row that has none, or never said. */
export default function BaggageIcons({ carryOn, checked }: BaggageIconsProps) {
  const label = baggageLabel(carryOn, checked);
  if (label === undefined) return null;
  const pieces = [
    ...Array.from({ length: carryOn ?? 0 }, () => CARRY_ON_ICON),
    ...Array.from({ length: checked ?? 0 }, () => CHECKED_BAG_ICON),
  ];
  return (
    <span role="img" aria-label={label} title={label} className="flex shrink-0 text-muted">
      {pieces.map((Icon, i) => (
        <Icon key={i} size={14} stroke={1.5} aria-hidden />
      ))}
    </span>
  );
}
