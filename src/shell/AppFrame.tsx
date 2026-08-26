import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import type { AppHue } from '../apps/types';
import AppHeader from './AppHeader';
import { hueStyle } from './hue';

export default function AppFrame({ name, hue }: { name: string; hue: AppHue | 'primary' }) {
  return (
    <div className="flex flex-1 flex-col" style={hueStyle(hue)}>
      <AppHeader name={name} />
      <Suspense fallback={<p className="text-muted">Cargando...</p>}>
        <Outlet />
      </Suspense>
    </div>
  );
}
