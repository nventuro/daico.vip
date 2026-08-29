import { isOneOffCategory, largestFirst, type Movement } from './breakdown';
import { categoryOf, type Rule } from './rules';
import LineRow from './LineRow';

/** Whether a movement is set apart on its own, and the way to turn that —
 *  absent when the mark is not this screen's to change. */
export interface MovementMark {
  marked: boolean;
  onToggle?: () => void;
}

interface MovementListProps {
  movements: Movement[];
  rules: Rule[];
  /** Set when a row stands for the whole purchase rather than the one
   *  installment being billed. */
  whole?: boolean;
  /** Draws a hairline under the last row too, for a list nothing else closes. */
  closed?: boolean;
  markOf: (movement: Movement) => MovementMark;
  onSelect: (movement: Movement) => void;
}

/** Movements as rows, largest amount first. */
export default function MovementList({
  movements,
  rules,
  whole = false,
  closed = false,
  markOf,
  onSelect,
}: MovementListProps) {
  return (
    <ul className={`divide-y divide-border ${closed ? 'border-b border-border' : ''}`}>
      {largestFirst(movements).map((movement) => {
        // A line its category already sets apart takes no mark of its own:
        // it is filed differently, not unmarked.
        const fixed = isOneOffCategory(categoryOf(movement.line, rules).category);
        const mark = markOf(movement);
        return (
          <LineRow
            key={`${movement.statementId}-${movement.index}`}
            line={movement.line}
            cents={movement.cents}
            whole={whole}
            oneOff={fixed || mark.marked}
            onSelect={() => onSelect(movement)}
            onToggleOneOff={fixed ? undefined : mark.onToggle}
          />
        );
      })}
    </ul>
  );
}
