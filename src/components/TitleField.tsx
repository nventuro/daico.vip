import FormField from './FormField';
import TextInput from './TextInput';

/** The title every entry is named by: the first field of every edit form. */
export default function TitleField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <FormField label="Título">
      <TextInput
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Título"
        autoCapitalize="none"
        required
      />
    </FormField>
  );
}
