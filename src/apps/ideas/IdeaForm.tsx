import { useState } from 'react';
import Body from '../../components/editor/Body';
import FormField from '../../components/FormField';
import FormFooter from '../../components/FormFooter';
import GroupField from '../../components/GroupField';
import TitleField from '../../components/TitleField';
import { entryForm } from '../../utils/formUtils';
import { lowercaseTrimmed } from '../../utils/textUtils';
import { NEW_IDEA, type IdeaInput } from './useIdeas';

interface IdeaFormProps {
  /** What the draft starts from: what the add bar typed and the group it
   *  most likely joins. */
  start: IdeaInput;
  /** The groups there are, for the idea to be filed under. */
  groups: string[];
  onSave: (input: IdeaInput) => void;
}

/** Where an idea is born: written nowhere until Guardar, so backing out
 *  leaves nothing behind. */
export default function IdeaForm({ start, groups, onSave }: IdeaFormProps) {
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
    NEW_IDEA,
    onSave,
    input.title !== '' && input.group_name !== '',
  );

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <TitleField value={title} onChange={setTitle} />

      <GroupField groups={groups} value={group} onChange={setGroup} />

      <FormField label="Contenido" group>
        <Body value={start.body} onChange={setBody} placeholder="Contenido" ariaLabel="Contenido" />
      </FormField>

      <FormFooter submitDisabled={!canSave} />
    </form>
  );
}
