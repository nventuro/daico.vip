import { useState } from 'react';
import { IconBold, IconHeading, IconItalic, IconLink, IconList } from '@tabler/icons-react';
import { useEditorState, type Editor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import IconButton from '../IconButton';
import LinkDialog from './LinkDialog';

interface EditorBubbleProps {
  editor: Editor;
}

/** A control of the bubble, lit while what is selected already has it. */
const BUTTON_CLASS = 'p-2';
const ACTIVE_BUTTON_CLASS = 'p-2 text-accent';

/**
 * What floats over a selection: the five things the household does to a
 * text — bold, italic, a heading, a list, a link. The link opens a dialog,
 * since an address is typed rather than toggled.
 */
export default function EditorBubble({ editor }: EditorBubbleProps) {
  const active = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor.isActive('bold'),
      italic: editor.isActive('italic'),
      heading: editor.isActive('heading', { level: 1 }),
      list: editor.isActive('bulletList'),
      link: editor.isActive('link'),
    }),
  });
  // The address the selection links to while the dialog is open: empty for
  // plain text, null while there is no dialog.
  const [linking, setLinking] = useState<string | null>(null);

  const chain = () => editor.chain().focus();
  const buttonClass = (lit: boolean) => (lit ? ACTIVE_BUTTON_CLASS : BUTTON_CLASS);

  function closeLink() {
    setLinking(null);
    editor.commands.focus();
  }

  return (
    <>
      <BubbleMenu
        editor={editor}
        className="z-40 flex bg-surface-inverse text-on-surface-inverse shadow-lg"
        // A tap on the bubble must not take the focus, and with it the
        // selection, away from the editor.
        onPointerDown={(e) => e.preventDefault()}
      >
        <IconButton
          label="Negrita"
          icon={IconBold}
          tone="band"
          className={buttonClass(active.bold)}
          aria-pressed={active.bold}
          onClick={() => chain().toggleBold().run()}
        />
        <IconButton
          label="Cursiva"
          icon={IconItalic}
          tone="band"
          className={buttonClass(active.italic)}
          aria-pressed={active.italic}
          onClick={() => chain().toggleItalic().run()}
        />
        <IconButton
          label="Título"
          icon={IconHeading}
          tone="band"
          className={buttonClass(active.heading)}
          aria-pressed={active.heading}
          onClick={() => chain().toggleHeading({ level: 1 }).run()}
        />
        <IconButton
          label="Lista"
          icon={IconList}
          tone="band"
          className={buttonClass(active.list)}
          aria-pressed={active.list}
          onClick={() => chain().toggleBulletList().run()}
        />
        <IconButton
          label="Enlace"
          icon={IconLink}
          tone="band"
          className={buttonClass(active.link)}
          aria-pressed={active.link}
          onClick={() =>
            setLinking((editor.getAttributes('link').href as string | undefined) ?? '')
          }
        />
      </BubbleMenu>

      {linking !== null && (
        <LinkDialog
          href={linking}
          onSave={(href) => chain().extendMarkRange('link').setLink({ href }).run()}
          onRemove={() => chain().extendMarkRange('link').unsetLink().run()}
          onClose={closeLink}
        />
      )}
    </>
  );
}
