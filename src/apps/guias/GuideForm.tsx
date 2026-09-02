import { useState } from 'react';
import FormFooter from '../../components/FormFooter';
import GroupField from '../../components/GroupField';
import TitleField from '../../components/TitleField';
import type { Guide } from '../../lib/offline/specs';
import { entryForm } from '../../utils/formUtils';
import type { GuideInput } from './useGuides';

interface GuideFormProps {
  guide: Guide;
  /** The groups there are, for the guide to be shelved under. */
  groups: string[];
  onSave: (input: GuideInput) => void;
}

/** Edits what the household decides about a guide: its title and the group
 *  it is shelved under. Keyed by the guide's id by its caller, so the draft
 *  starts from the guide once and never chases it afterwards. Nothing to
 *  delete: a guide is only ever removed by the import. */
export default function GuideForm({ guide, groups, onSave }: GuideFormProps) {
  const [title, setTitle] = useState(guide.title);
  const [group, setGroup] = useState(guide.group_name);

  // A guide keeps its capitals — it is named after a document, not typed in
  // the lower case the household's lists are kept in — and so does its group.
  const input: GuideInput = { title: title.trim(), group_name: group.trim() };
  const { canSave, onSubmit } = entryForm(
    input,
    { title: guide.title, group_name: guide.group_name },
    onSave,
    input.title !== '' && input.group_name !== '',
  );

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <TitleField value={title} onChange={setTitle} autoCapitalize="sentences" />

      <GroupField groups={groups} value={group} onChange={setGroup} />

      <FormFooter submitDisabled={!canSave} />
    </form>
  );
}
