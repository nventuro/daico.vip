import { CONTROL_CLASS } from '../components/controlClasses';

interface PhraseWordsProps {
  /** One entry per word of the phrase. */
  words: string[];
  /** Absent for a phrase only shown (to be written down), present for one being typed. */
  onChange?: (words: string[]) => void;
}

/**
 * The household phrase as a grid of numbered word boxes. Typing or pasting
 * several words into one box spreads them over the following boxes, so a
 * whole phrase can be pasted at once.
 */
export default function PhraseWords({ words, onChange }: PhraseWordsProps) {
  function change(index: number, value: string) {
    if (!onChange) return;
    const typed = value.split(/\s+/);
    const next = [...words];
    typed.forEach((word, offset) => {
      if (index + offset < next.length) next[index + offset] = word;
    });
    onChange(next);
  }

  return (
    <div className="grid grid-cols-2 gap-2 text-left">
      {words.map((word, index) => (
        <label
          key={index}
          className={`${CONTROL_CLASS} flex items-center gap-2 focus-within:border-primary ${onChange ? '' : 'font-medium'}`}
        >
          <span className="w-3.5 shrink-0 text-right text-xs text-muted">{index + 1}</span>
          {onChange ? (
            <input
              type="text"
              value={word}
              onChange={(e) => change(index, e.target.value)}
              aria-label={`Palabra ${index + 1}`}
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              className="min-w-0 flex-1 bg-transparent outline-none"
            />
          ) : (
            <span>{word}</span>
          )}
        </label>
      ))}
    </div>
  );
}
