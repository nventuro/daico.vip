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
 * only way to search the list is to type part of what an option says. Every
 * keystroke is resolved to a code — so the field is right even if the form is
 * submitted without leaving it — and three letters are always taken as one, so
 * an airport the list has never heard of still goes in.
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

  function change(text: string) {
    const code = resolveAirportCode(text);
    // Picking from the list drops its whole value in: snap to the code rather
    // than leave a city sitting in a field that holds one.
    setTyping(code !== null && text.startsWith(`${code} `) ? null : text);
    onChange(code);
  }

  return (
    <TextInput
      type="text"
      value={typing ?? value ?? ''}
      onChange={(e) => change(e.target.value)}
      onBlur={() => setTyping(null)}
      placeholder="AEP"
      aria-label={label}
      list={list}
      autoCapitalize="none"
      autoComplete="off"
      className={className}
    />
  );
}
