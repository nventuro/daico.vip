import FormField from './FormField';
import TextInput from './TextInput';

interface TitleFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** Whether the keyboard capitalises what is typed: an entry named after a
   *  place or a person takes capitals, the lower-case titles most lists are
   *  kept in do not. */
  autoCapitalize?: 'none' | 'sentences';
}

/** The title every entry is named by: the first field of every edit form. */
export default function TitleField({ value, onChange, autoCapitalize = 'none' }: TitleFieldProps) {
  return (
    <FormField label="Título">
      <TextInput
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Título"
        autoCapitalize={autoCapitalize}
        required
      />
    </FormField>
  );
}
