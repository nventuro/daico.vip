import { useEffect, useImperativeHandle, useMemo, useRef, type Ref } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import EditorBubble from './EditorBubble';
import { bodyExtensions } from './extensions';

/** What a page can ask of a body: to take the caret. */
export interface BodyHandle {
  focus: () => void;
}

export interface BodyProps {
  /** The text as stored, in the app's markdown. Read once, when the editor is
   *  made: a body never chases the row it came from. */
  value: string;
  /** Every change, as markdown. Saving it, and when, is the caller's. */
  onChange: (markdown: string) => void;
  /** The text's own name, shown while it is empty. */
  placeholder: string;
  autoFocus?: boolean;
  ariaLabel: string;
  ref?: Ref<BodyHandle>;
}

/**
 * The editable element itself: no box, no outline, a selection in the app's
 * colour, and the placeholder drawn in the first block while the body is
 * empty (the classes and attribute are the placeholder extension's).
 */
const CONTENT_CLASS =
  'min-h-32 outline-none selection:bg-(--app)/25 [&_.is-editor-empty:first-child]:before:pointer-events-none [&_.is-editor-empty:first-child]:before:float-left [&_.is-editor-empty:first-child]:before:h-0 [&_.is-editor-empty:first-child]:before:text-muted [&_.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]';

/** The editor behind `Body`: the text drawn as it reads, written in place. */
export default function BodyEditor({
  value,
  onChange,
  placeholder,
  autoFocus = false,
  ariaLabel,
  ref,
}: BodyProps) {
  // The editor is made once and keeps the handlers it was made with, so the
  // latest `onChange` is reached through a ref rather than by remaking it.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const extensions = useMemo(() => bodyExtensions(placeholder), [placeholder]);
  const editor = useEditor({
    extensions,
    content: value,
    contentType: 'markdown',
    autofocus: autoFocus ? 'end' : false,
    editorProps: {
      attributes: {
        class: CONTENT_CLASS,
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-label': ariaLabel,
      },
    },
    onUpdate: ({ editor }) => onChangeRef.current(editor.getMarkdown()),
  });

  useImperativeHandle(ref, () => ({ focus: () => editor.commands.focus('start') }), [editor]);

  return (
    // Sized and coloured here: a body inside a captioned field would otherwise
    // inherit the caption's small, muted type.
    <div className="text-base text-on-surface">
      <EditorContent editor={editor} />
      <EditorBubble editor={editor} />
    </div>
  );
}
