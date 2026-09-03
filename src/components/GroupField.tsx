import { useState, type KeyboardEvent } from 'react';
import { ChipSelect } from './Chip';
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
  /** Every change on a form, where the value is a draft. On a page only a
   *  group settled on: one of those there are on the pick, a new one when
   *  its name is left non-empty. */
  onChange: (value: string) => void;
  /** `field`: a captioned control on a form. `chip`: a chip under an entry's
   *  title, for a page that keeps what is chosen as it is chosen. */
  look?: 'field' | 'chip';
}

/**
 * The group an entry is filed under: one of those there are, or a new one
 * named right here — the last option of the list opens a field for its name.
 * With no groups yet there is nothing to choose from, and the name field
 * stands alone.
 */
export default function GroupField({ groups, value, onChange, look = 'field' }: GroupFieldProps) {
  const chip = look === 'chip';
  // Whether the name field is open. It stays open once chosen, while the name
  // is still blank or half typed.
  const [naming, setNaming] = useState(!groups.includes(value));
  // On a page the name is typed here and handed over once, when it is left:
  // every keystroke would otherwise file the entry under a group of its own.
  const [name, setName] = useState('');

  function leaveName() {
    const typed = name.trim();
    setNaming(false);
    setName('');
    if (typed) onChange(typed);
  }

  function onNameKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    e.currentTarget.blur();
  }

  const nameInput = (label: string) => (
    <TextInput
      type="text"
      value={chip ? name : value}
      onChange={(e) => (chip ? setName : onChange)(e.target.value)}
      onBlur={chip ? leaveName : undefined}
      onKeyDown={chip ? onNameKeyDown : undefined}
      placeholder={NAME_LABEL}
      aria-label={label}
      autoCapitalize="none"
      autoFocus={chip}
      required={!chip}
    />
  );

  if (groups.length === 0) return <FormField label="Grupo">{nameInput('Grupo')}</FormField>;

  function pick(option: string) {
    if (option === NEW) {
      setNaming(true);
      if (!chip) onChange('');
      return;
    }
    setNaming(false);
    onChange(groups[Number(option)]);
  }

  const options = (
    <>
      {groups.map((group, i) => (
        <option key={group} value={String(i)}>
          {group}
        </option>
      ))}
      <option value={NEW}>Nuevo grupo…</option>
    </>
  );

  if (chip) {
    return naming ? (
      nameInput(NAME_LABEL)
    ) : (
      <ChipSelect
        value={String(groups.indexOf(value))}
        onChange={(e) => pick(e.target.value)}
        aria-label="Grupo"
      >
        {options}
      </ChipSelect>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <FormField label="Grupo">
        <Select
          value={naming ? NEW : String(groups.indexOf(value))}
          onChange={(e) => pick(e.target.value)}
          aria-label="Grupo"
        >
          {options}
        </Select>
      </FormField>
      {naming && nameInput(NAME_LABEL)}
    </div>
  );
}
