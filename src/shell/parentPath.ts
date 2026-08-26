/** The URL one level up from `pathname`: the last segment is dropped, and the
 *  root stays the root. */
export function parentPath(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  segments.pop();
  return `/${segments.join('/')}`;
}
