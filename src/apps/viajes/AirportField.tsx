import { useId, useMemo, useState } from 'react';
import TextInput from '../../components/TextInput';
import {
  airportAfterTyping,
  airportFieldValue,
  airportMatches,
  airportOptionText,
  pickedAirportCode,
} from './airports';
import { TRIP_TRANSPORT_PLACES } from './labels';

interface AirportFieldProps {
  /** The IATA code, upper-case, or null when none is typed. */
  value: string | null;
  onChange: (value: string | null) => void;
  /** Accessible name of the control, e.g. "Aeropuerto de salida". */
  label: string;
  /** The airports the household has already flown through, most used first:
   *  what the field offers before anything is typed, and ahead of the rest. */
  own: readonly string[];
}

/**
 * The airport a flight leaves from or lands at. What it holds is a code, but
 * what it takes and shows is words: a city is how an airport is remembered.
 * The list under it is the browser's own, handed only the airports that fit
 * what is being typed — the whole list is thousands, and a browser matches an
 * option by its letters as they are, accents and all. What is typed is
 * resolved to a code once the field is left, or picked from the list — half a
 * city resolves to the wrong airport, and every keystroke would be a row
 * written — and three letters are always taken as one, so an airport the list
 * has never heard of still goes in.
 */
export default function AirportField({ value, onChange, label, own }: AirportFieldProps) {
  const listId = useId();
  // What is being typed, until the field is left. The stored value is a code,
  // and showing its airport back mid-word would eat the city being typed.
  const [typing, setTyping] = useState<string | null>(null);

  const offered = useMemo(() => airportMatches(typing ?? '', own), [typing, own]);

  function commit(text: string) {
    const code = airportAfterTyping(text, value);
    setTyping(null);
    if (code !== value) onChange(code);
  }

  function change(text: string) {
    // Picking from the list drops its whole value in: that is the airport,
    // and it goes in at once rather than leave a city sitting in the field.
    if (pickedAirportCode(text) !== null) commit(text);
    else setTyping(text);
  }

  return (
    <>
      <datalist id={listId}>
        {offered.map(([code, name]) => (
          <option key={code} value={airportOptionText(code, name, typing ?? '')} />
        ))}
      </datalist>
      <TextInput
        type="text"
        value={typing ?? (value === null ? '' : airportFieldValue(value))}
        onChange={(e) => change(e.target.value)}
        // The airport shown is replaced whole, never edited letter by letter.
        onFocus={(e) => e.currentTarget.select()}
        onBlur={() => {
          if (typing !== null) commit(typing);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            e.currentTarget.blur();
          }
        }}
        placeholder={TRIP_TRANSPORT_PLACES.flight}
        aria-label={label}
        list={listId}
        autoCapitalize="none"
        autoComplete="off"
      />
    </>
  );
}
