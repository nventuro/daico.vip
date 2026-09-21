import { useState } from 'react';
import TextInput from '../../components/TextInput';
import { STATION_MAX_CHARS } from './stations';

interface StationFieldProps {
  /** The station's or the terminal's name, or null when none is typed. */
  value: string | null;
  onChange: (value: string | null) => void;
  /** Accessible name of the control, e.g. "Estación de salida". */
  label: string;
  /** What the empty field reads: what is being asked for, in a word. */
  placeholder: string;
  /** The datalist the stations are offered from, shared by both of a pasaje. */
  list: string;
}

/**
 * The station or the terminal a train or a bus leaves from or arrives at: a
 * name as the ticket prints it, since a city has several and the name is what
 * tells them apart. It is handed over once, when the field is left — every
 * keystroke would otherwise be a row written.
 */
export default function StationField({
  value,
  onChange,
  label,
  placeholder,
  list,
}: StationFieldProps) {
  // What is being typed, until the field is left.
  const [typing, setTyping] = useState<string | null>(null);

  function commit(text: string) {
    const name = text.trim().slice(0, STATION_MAX_CHARS) || null;
    setTyping(null);
    if (name !== value) onChange(name);
  }

  return (
    <TextInput
      type="text"
      value={typing ?? value ?? ''}
      onChange={(e) => setTyping(e.target.value)}
      onBlur={() => {
        if (typing !== null) commit(typing);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
      placeholder={placeholder}
      aria-label={label}
      list={list}
      autoComplete="off"
    />
  );
}
