import { useState } from 'react';
import FormField from './FormField';
import Select from './Select';
import TextInput from './TextInput';

/** The option that stands for a group that does not exist yet. The others are
 *  told apart by position, since a group's name is whatever was typed. */
const NEW = 'new';

const NAME_LABEL = 'Nombre del grupo';

interface GroupFieldProps {
  /** The groups there are, in the order they are offered. */
  groups: string[];
  /** The group as it stands: one of `groups`, the name of one being made, or
   *  blank. */
  value: string;
  onChange: (value: string) => void;
}

/**
 * The group an entry is filed under: one of those there are, or a new one
 * named right here — the last option of the list opens a field for its name.
 * With no groups yet there is nothing to choose from, and the name field
 * stands alone.
 */
export default function GroupField({ groups, value, onChange }: GroupFieldProps) {
  // Whether the name field is open. It stays open once chosen, while the name
  // is still blank or half typed.
  const [naming, setNaming] = useState(!groups.includes(value));

  const nameInput = (label: string) => (
    <TextInput
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={NAME_LABEL}
      aria-label={label}
      autoCapitalize="none"
      required
    />
  );

  if (groups.length === 0) return <FormField label="Grupo">{nameInput('Grupo')}</FormField>;

  function pick(option: string) {
    if (option === NEW) {
      setNaming(true);
      onChange('');
      return;
    }
    setNaming(false);
    onChange(groups[Number(option)]);
  }

  return (
    <div className="flex flex-col gap-2">
      <FormField label="Grupo">
        <Select
          value={naming ? NEW : String(groups.indexOf(value))}
          onChange={(e) => pick(e.target.value)}
          aria-label="Grupo"
        >
          {groups.map((group, i) => (
            <option key={group} value={String(i)}>
              {group}
            </option>
          ))}
          <option value={NEW}>Nuevo grupo…</option>
        </Select>
      </FormField>
      {naming && nameInput(NAME_LABEL)}
    </div>
  );
}
