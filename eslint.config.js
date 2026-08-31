import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

// Dates read dd/mm and hours read 24-hour in this app whatever the browser's
// language, so whatever lets the browser choose is confined to one file each:
// the native inputs to NativeDatePicker / NativeTimePicker, turning a date
// into text to dateUtils.
const NATIVE_DATE_INPUT_TYPES = /^(date|datetime-local|month|week|time)$/;
const nativeDateInput = {
  selector: `JSXOpeningElement[name.name='input'] > JSXAttribute[name.name='type']:matches([value.value=${NATIVE_DATE_INPUT_TYPES}], [value.expression.value=${NATIVE_DATE_INPUT_TYPES}])`,
  message:
    "A native date or time input follows the browser's language (month first, and a 12-hour clock, in English). Use DatePicker / TimePicker, or NativeDatePicker / NativeTimePicker behind a control of your own.",
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

// One direction only, from the bottom up: utils (pure) ← lib (infrastructure)
// ← components (shared UI) ← apps (the features) ← shell (what mounts them).
// A layer may use everything under it and nothing over it, so a piece of one
// app can never end up wired into another's screens through a shared file.
// `src/apps/types.ts` is the exception: it is the contract the shell mounts an
// app by, so anything may name it.
const layer = (paths, message) => ({
  'no-restricted-imports': ['error', { patterns: [{ group: paths, message }] }],
});
const APPS = ['**/apps/**', '!**/apps/types'];
const COMPONENTS = ['**/components/**'];
const HOOKS = ['**/hooks/**'];
const SHELL = ['**/shell/**'];

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
    files: ['src/components/NativeDatePicker.tsx', 'src/components/NativeTimePicker.tsx'],
    rules: { 'no-restricted-syntax': ['error', ...dateToText, browserLocale] },
  },
  {
    files: ['src/utils/dateUtils.ts'],
    rules: { 'no-restricted-syntax': ['error', nativeDateInput, browserLocale] },
  },
  {
    files: ['src/utils/**'],
    rules: layer(
      ['**/lib/**', ...COMPONENTS, ...HOOKS, ...APPS, ...SHELL],
      'src/utils holds pure helpers: it may import src/types.ts and its own siblings, nothing else.',
    ),
  },
  {
    files: ['src/lib/**'],
    rules: layer(
      [...COMPONENTS, ...HOOKS, ...APPS, ...SHELL],
      'src/lib is below the UI: it may import src/utils and src/types.ts (and src/apps/types.ts, the module contract), never a component, a hook, an app or the shell.',
    ),
  },
  {
    files: ['src/components/**', 'src/hooks/**'],
    rules: layer(
      [...APPS, ...SHELL],
      'A shared component or hook may not reach into an app or the shell — take what it needs as a prop or an argument.',
    ),
  },
  {
    files: ['src/apps/**'],
    rules: layer(
      [...SHELL, '**/registry'],
      'An app knows nothing of the shell that mounts it, nor of the registry it is listed in.',
    ),
  },
  {
    // The registry's own test is what checks the registry.
    files: ['src/apps/registry.test.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },
]);
