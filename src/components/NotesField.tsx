import FormField from './FormField';
import TextArea from './TextArea';

interface NotesFieldProps {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}

/** Whatever else there is to say about an entry, free text. */
export default function NotesField({ value, onChange, rows = 5 }: NotesFieldProps) {
  return (
    <FormField label="Notas">
      <TextArea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Notas"
        rows={rows}
      />
    </FormField>
  );
}
