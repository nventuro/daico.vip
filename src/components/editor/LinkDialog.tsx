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

/** Where a link may go: to the web, to a mailbox, or into the app. Anything
 *  else the browser could be made to run is not a place. */
const LINK_SCHEME = /^(https?:|mailto:)/i;
const ANY_SCHEME = /^[a-z][a-z0-9+.-]*:/i;

/** Whether `address` is somewhere a link may go. */
function isLinkable(address: string): boolean {
  return address.startsWith('/') || LINK_SCHEME.test(address);
}

/** An address typed without a scheme is a web address; a path is the app's
 *  own; one under another scheme is nowhere, null. */
function withScheme(address: string): string | null {
  if (isLinkable(address)) return address;
  if (ANY_SCHEME.test(address)) return null;
  return `https://${address}`;
}

/** Where a link's address is typed, changed, opened or taken off. */
export default function LinkDialog({ href, onSave, onRemove, onClose }: LinkDialogProps) {
  const [address, setAddress] = useState(href);
  const target = withScheme(address.trim());

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!target) return;
    onSave(target);
    onClose();
  }

  return (
    <ModalDialog onClose={onClose} layout="sheet" label="Enlace">
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
            {isLinkable(href) && (
              <Button
                variant="link"
                onClick={() => window.open(href, '_blank', 'noopener,noreferrer')}
              >
                Abrir
              </Button>
            )}
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

        <DialogFooter onCancel={onClose} confirmLabel="Guardar" submit confirmDisabled={!target} />
      </form>
    </ModalDialog>
  );
}
