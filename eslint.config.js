import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

// Dates read dd/mm in this app whatever the browser's language, so whatever
// lets the browser choose the order is confined to one file each: the native
// date input to NativeDatePicker, turning a date into text to dateUtils.
const NATIVE_DATE_INPUT_TYPES = /^(date|datetime-local|month|week|time)$/;
const nativeDateInput = {
  selector: `JSXOpeningElement[name.name='input'] > JSXAttribute[name.name='type']:matches([value.value=${NATIVE_DATE_INPUT_TYPES}], [value.expression.value=${NATIVE_DATE_INPUT_TYPES}])`,
  message:
    "A native date input prints the date in the browser's language (month first in English). Use DatePicker, or NativeDatePicker behind a control of your own.",
};
const dateToTextMessage =
  'A date becomes text only in src/utils/dateUtils.ts, where the order is dd/mm: use a helper from there, or add one.';
const dateToText = [
  {
    selector:
      'CallExpression[callee.property.name=/^(toLocaleDateString|toLocaleTimeString|toDateString)$/]',
    message: dateToTextMessage,
  },
  {
    selector: "MemberExpression[object.name='Intl'][property.name='DateTimeFormat']",
    message: dateToTextMessage,
  },
];
const browserLocale = {
  selector: "CallExpression[callee.property.name='toLocaleString'][arguments.length=0]",
  message: "toLocaleString() with no locale follows the browser's language: pass 'es-AR'.",
};

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      'no-restricted-syntax': ['error', nativeDateInput, ...dateToText, browserLocale],
    },
  },
  {
    files: ['src/components/NativeDatePicker.tsx'],
    rules: { 'no-restricted-syntax': ['error', ...dateToText, browserLocale] },
  },
  {
    files: ['src/utils/dateUtils.ts'],
    rules: { 'no-restricted-syntax': ['error', nativeDateInput, browserLocale] },
  },
]);
