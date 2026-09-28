import type { SVGProps } from 'react';

export type AppIconName = 'arrow-right' | 'arrow-up-right' | 'building' | 'calendar' | 'chart' | 'dollar' | 'eye' | 'eye-off' | 'file' | 'home' | 'lock' | 'plus' | 'settings' | 'shield' | 'wallet';

type AppIconProps = Omit<SVGProps<SVGSVGElement>, 'children'> & {
  name: AppIconName;
  size?: number;
  strokeWidth?: number;
};

export function AppIcon({ name, size = 20, strokeWidth = 2, ...props }: AppIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
      {iconPaths[name]}
    </svg>
  );
}

const iconPaths: Record<AppIconName, React.ReactNode> = {
  'arrow-right': <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
  'arrow-up-right': <><path d="M7 17 17 7" /><path d="M8 7h9v9" /></>,
  building: <><path d="M4 21h16" /><path d="M6 21V5l6-3 6 3v16" /><path d="M9 9h.01M15 9h.01M9 13h.01M15 13h.01M11 21v-4h2v4" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18M8 14h3M8 17h5" /></>,
  chart: <><path d="M3 3v18h18" /><path d="m7 16 4-5 3 2 5-7" /></>,
  dollar: <><circle cx="12" cy="12" r="9" /><path d="M15 8.5c-.7-.8-1.8-1.2-3-1.2-1.7 0-3 .9-3 2.3 0 3.4 6 1.7 6 4.8 0 1.4-1.2 2.3-3 2.3-1.2 0-2.4-.5-3.2-1.4M12 5.5v13" /></>,
  eye: <><path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="2.5" /></>,
  'eye-off': <><path d="m3 3 18 18" /><path d="M10.6 6.7A10.7 10.7 0 0 1 12 6.5c6 0 9.5 5.5 9.5 5.5a16.9 16.9 0 0 1-3.3 3.6M6.2 6.2A16.5 16.5 0 0 0 2.5 12S6 17.5 12 17.5c1.1 0 2.1-.2 3-.6" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>,
  file: <><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></>,
  home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10M9 20v-6h6v6" /></>,
  lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.1 2.1-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.2h-3v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-2.1-2.1.1-.1A1.7 1.7 0 0 0 7 15a1.7 1.7 0 0 0-1.5-1H5.3v-3h.2A1.7 1.7 0 0 0 7 10a1.7 1.7 0 0 0-.3-1.9l-.1-.1 2.1-2.1.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5v-.2h3v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 2.1 2.1-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.2v3h-.2a1.7 1.7 0 0 0-1.5 1Z" /></>,
  shield: <><path d="M12 3 20 6v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z" /><path d="m8.5 12 2.2 2.2 4.8-5" /></>,
  wallet: <><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H19v15H6.5A2.5 2.5 0 0 1 4 17.5z" /><path d="M4 8h15M15 13h4" /><circle cx="15" cy="13" r=".5" fill="currentColor" /> </>,
};
