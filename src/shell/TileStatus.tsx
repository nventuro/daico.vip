/** The subline under an app tile's name. Takes the app's `useStatus` as a prop
 *  so each tile makes exactly one fixed hook call, whatever the registry holds. */
export default function TileStatus({ useStatus }: { useStatus: () => string | null }) {
  const status = useStatus();
  return status ? <span className="text-xs font-medium opacity-90">{status}</span> : null;
}
