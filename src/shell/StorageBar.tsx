/** How dark a slice of the bar is drawn; the order is the order they are read
 *  in below it. */
type Tone = 'strong' | 'medium' | 'soft';

const TONE_CLASS: Record<Tone, string> = {
  strong: 'bg-on-surface',
  medium: 'bg-muted-strong',
  soft: 'bg-neutral-hover',
};

/** What the device's room is made of, as one flat bar: each slice as wide as
 *  its share. Empty slices are left out so a hairline never stands for nothing. */
export default function StorageBar({ parts }: { parts: { bytes: number; tone: Tone }[] }) {
  const total = parts.reduce((sum, part) => sum + part.bytes, 0);
  if (total === 0) return null;

  return (
    <div aria-hidden className="flex h-2.5 w-full overflow-hidden border border-border">
      {parts
        .filter((part) => part.bytes > 0)
        .map((part) => (
          <span
            key={part.tone}
            style={{ width: `${(part.bytes / total) * 100}%` }}
            className={TONE_CLASS[part.tone]}
          />
        ))}
    </div>
  );
}
