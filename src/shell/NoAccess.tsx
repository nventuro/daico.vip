import { IconLock } from '@tabler/icons-react';
import Gate from './Gate';
import SignOutLink from './SignOutLink';

export default function NoAccess() {
  return (
    <Gate
      icon={IconLock}
      title="Sin acceso"
      text="Esta cuenta no está autorizada para entrar. Si creés que es un error, probá con otra cuenta."
    >
      <SignOutLink className="mt-8" />
    </Gate>
  );
}
