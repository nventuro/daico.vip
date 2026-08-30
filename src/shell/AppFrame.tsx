import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import type { TablerIcon } from '@tabler/icons-react';
import AppHeader from './AppHeader';
import { HueContext, hueStyle, type Hue } from '../components/hue';
import SkeletonRows from '../components/SkeletonRows';

interface AppFrameProps {
  name: string;
  hue: Hue;
  icon?: TablerIcon;
}

export default function AppFrame({ name, hue, icon }: AppFrameProps) {
  return (
    <HueContext.Provider value={hue}>
      <div className="flex flex-1 flex-col" style={hueStyle(hue)}>
        <AppHeader name={name} icon={icon} />
        <Suspense fallback={<SkeletonRows />}>
          <Outlet />
        </Suspense>
      </div>
    </HueContext.Provider>
  );
}
