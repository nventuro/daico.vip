import { useState } from 'react';
import TextInput from '../../components/TextInput';
import { resolveAirportCode } from './airports';

interface AirportFieldProps {
  /** The IATA code, upper-case, or null when none is typed. */
  value: string | null;
  onChange: (value: string | null) => void;
  /** Accessible name of the control, e.g. "Aeropuerto de salida". */
  label: string;
  /** The datalist the airports are offered from, shared by both of a pasaje. */
  list: string;
  className?: string;
}

/**
 * The airport a pasaje leaves from or lands at. What it holds is a code, but
 * what it takes is free text: a city is how an airport is remembered, and the
 * only way to search the list is to type part of what an option says. What is
 * typed is resolved to a code once the field is left, or picked from the list
 * — half a city resolves to the wrong airport, and every keystroke would be a
 * row written — and three letters are always taken as one, so an airport the
 * list has never heard of still goes in.
 */
export default function AirportField({
  value,
  onChange,
  label,
  list,
  className,
}: AirportFieldProps) {
  // What is being typed, until the field is left. The stored value is a code,
  // and showing it back mid-word would eat the city being typed.
  const [typing, setTyping] = useState<string | null>(null);

  function commit(text: string) {
    const code = resolveAirportCode(text);
    setTyping(null);
    if (code !== value) onChange(code);
  }

  function change(text: string) {
    const code = resolveAirportCode(text);
    // Picking from the list drops its whole value in: that is the airport,
    // and it goes in at once rather than leave a city sitting in the field.
    if (code !== null && text.startsWith(`${code} `)) commit(text);
    else setTyping(text);
  }

  return (
    <TextInput
      type="text"
      value={typing ?? value ?? ''}
      onChange={(e) => change(e.target.value)}
      onBlur={() => {
        if (typing !== null) commit(typing);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
      placeholder="AEP"
      aria-label={label}
      list={list}
      autoCapitalize="none"
      autoComplete="off"
      className={className}
    />
  );
}
