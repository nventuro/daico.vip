import { useState } from 'react';
import type { Idea } from '../../lib/offline/specs';
import FormField from '../../components/FormField';
import FormFooter from '../../components/FormFooter';
import GroupField from '../../components/GroupField';
import TextArea from '../../components/TextArea';
import TitleField from '../../components/TitleField';
import { CONTROL_CLASS } from '../../components/controlClasses';
import { entryForm } from '../../utils/formUtils';
import { lowercaseTrimmed } from '../../utils/textUtils';
import { NEW_IDEA, type IdeaInput } from './useIdeas';

interface IdeaFormProps {
  /** The idea being edited, or null for one being created — which is written
   *  on save, so backing out leaves nothing behind. */
  idea: Idea | null;
  /** What the draft starts from: the idea itself, or what the add bar typed
   *  and the group it most likely joins. */
  start: IdeaInput;
  /** The groups there are, for the idea to be filed under. */
  groups: string[];
  onSave: (input: IdeaInput) => void;
  /** The idea's own delete; one that does not exist yet has none. */
  onRemove?: () => void;
}

/** Creates or edits one idea. Keyed by the idea's id by its caller, so the
 *  local draft starts from the idea once and never chases it afterwards. */
export default function IdeaForm({ idea, start, groups, onSave, onRemove }: IdeaFormProps) {
  const [title, setTitle] = useState(start.title);
  const [group, setGroup] = useState(start.group_name);
  const [body, setBody] = useState(start.body);

  const input: IdeaInput = {
    title: lowercaseTrimmed(title),
    group_name: lowercaseTrimmed(group),
    body,
  };
  // An idea being created is compared against nothing stored, so any title
  // and group are worth saving.
  const { canSave, onSubmit } = entryForm(
    input,
    idea ? { title: idea.title, group_name: idea.group_name, body: idea.body } : NEW_IDEA,
    onSave,
    input.title !== '' && input.group_name !== '',
  );

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <TitleField value={title} onChange={setTitle} />

      <GroupField groups={groups} value={group} onChange={setGroup} />

      <FormField label="Detalle (Markdown)">
        <TextArea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          aria-label="Detalle (Markdown)"
          rows={16}
          className={`${CONTROL_CLASS} font-mono`}
        />
      </FormField>

      <FormFooter
        removeLabel={idea ? 'Eliminar idea' : undefined}
        confirmQuestion={idea ? '¿Eliminar la idea?' : undefined}
        onRemove={onRemove}
        submitDisabled={!canSave}
      />
    </form>
  );
}
