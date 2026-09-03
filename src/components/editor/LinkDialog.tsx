import { useState, type FormEvent } from 'react';
import Button from '../Button';
import DialogFooter from '../DialogFooter';
import FormField from '../FormField';
import ModalDialog from '../ModalDialog';
import TextInput from '../TextInput';

interface LinkDialogProps {
  /** The address the selection already links to; empty for plain text. */
  href: string;
  onSave: (href: string) => void;
  onRemove: () => void;
  onClose: () => void;
}

/** An address typed without a scheme is a web address; a path is the app's own. */
function withScheme(address: string): string {
  return /^[a-z][a-z0-9+.-]*:/i.test(address) || address.startsWith('/')
    ? address
    : `https://${address}`;
}

/** Where a link's address is typed, changed, opened or taken off. */
export default function LinkDialog({ href, onSave, onRemove, onClose }: LinkDialogProps) {
  const [address, setAddress] = useState(href);
  const typed = address.trim();

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!typed) return;
    onSave(withScheme(typed));
    onClose();
  }

  return (
    <ModalDialog onClose={onClose} layout="sheet">
      <form onSubmit={submit} className="flex flex-col gap-4 p-4">
        <span className="font-medium">Enlace</span>

        <FormField label="Dirección">
          <TextInput
            type="text"
            inputMode="url"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            aria-label="Dirección"
            placeholder="https://"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            autoFocus
          />
        </FormField>

        {href && (
          <div className="flex items-center justify-between">
            <Button
              variant="link"
              onClick={() => window.open(href, '_blank', 'noopener,noreferrer')}
            >
              Abrir
            </Button>
            <Button
              variant="dangerOutline"
              size="sm"
              onClick={() => {
                onRemove();
                onClose();
              }}
            >
              Quitar
            </Button>
          </div>
        )}

        <DialogFooter onCancel={onClose} confirmLabel="Guardar" submit confirmDisabled={!typed} />
      </form>
    </ModalDialog>
  );
}
