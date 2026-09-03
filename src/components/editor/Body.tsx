import { lazy, Suspense } from 'react';
import { MARKDOWN_CLASS } from '../markdown/classes';
import Markdown from '../markdown/Markdown';
import type { BodyHandle, BodyProps } from './BodyEditor';

// The editor and everything it brings in are the one large thing a body
// needs, and only a body needs: they stay out of the main bundle and arrive
// when a body is first on screen. Until then the text is drawn as read, so a
// page never waits on them.
const BodyEditor = lazy(() => import('./BodyEditor'));

export type { BodyHandle, BodyProps };

/** The one control for a free text: what it says, drawn as it reads and
 *  written in place. Its placeholder is the text's own name. */
export default function Body(props: BodyProps) {
  return (
    <Suspense
      fallback={
        props.value.trim() ? (
          <div className="text-base text-on-surface">
            <Markdown body={props.value} />
          </div>
        ) : (
          <p className={`${MARKDOWN_CLASS.p} text-base text-muted`}>{props.placeholder}</p>
        )
      }
    >
      <BodyEditor {...props} />
    </Suspense>
  );
}
