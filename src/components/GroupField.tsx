import { useState, type KeyboardEvent } from 'react';
import { ChipSelect } from './Chip';
import TextInput from './TextInput';

/** The option that stands for a group that does not exist yet, and the one
 *  for no group at all. The groups are told apart by position, since a
 *  group's name is whatever was typed. */
const NEW = 'new';
const NONE = 'none';

const NAME_LABEL = 'Nombre del grupo';

interface GroupFieldProps {
  /** The groups there are, in the order they are offered. */
  groups: string[];
  /** The group as it stands: one of `groups`, or blank for none. */
  value: string;
  /** A group settled on: one of those there are on the pick, a new one when
   *  its name is left non-empty, blank when the entry is taken out of its
   *  group. */
  onChange: (value: string) => void;
  /** Whether the entry may be filed under no group, offered as «Sin grupo». */
  optional?: boolean;
}

/**
 * The group an entry is filed under, a chip under its title that keeps what
 * is chosen as it is chosen: one of the groups there are, or a new one named
 * right here — the last option of the list opens a field for its name.
 */
export default function GroupField({ groups, value, onChange, optional = false }: GroupFieldProps) {
  const none = optional && value === '';
  // Whether the name field is open: from the start for a group that is not
  // there yet, and then while the name is still blank or half typed.
  const [naming, setNaming] = useState(!none && !groups.includes(value));
  // The name is typed here and handed over once, when it is left: every
  // keystroke would otherwise file the entry under a group of its own.
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

  function pick(option: string) {
    if (option === NEW) {
      setNaming(true);
      return;
    }
    setNaming(false);
    onChange(option === NONE ? '' : groups[Number(option)]);
  }

  if (naming) {
    return (
      <TextInput
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={leaveName}
        onKeyDown={onNameKeyDown}
        placeholder={NAME_LABEL}
        aria-label={NAME_LABEL}
        autoCapitalize="none"
        autoFocus
      />
    );
  }

  return (
    <ChipSelect
      value={none ? NONE : String(groups.indexOf(value))}
      onChange={(e) => pick(e.target.value)}
      aria-label="Grupo"
    >
      {optional && <option value={NONE}>Sin grupo</option>}
      {groups.map((group, i) => (
        <option key={group} value={String(i)}>
          {group}
        </option>
      ))}
      <option value={NEW}>Nuevo grupo…</option>
    </ChipSelect>
  );
}
