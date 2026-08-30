import FormField from './FormField';
import TextArea from './TextArea';

interface CommentsFieldProps {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}

/** Whatever else there is to say about an entry, free text. */
export default function CommentsField({ value, onChange, rows = 5 }: CommentsFieldProps) {
  return (
    <FormField label="Comentarios">
      <TextArea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Comentarios"
        rows={rows}
      />
    </FormField>
  );
}
