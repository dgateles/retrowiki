import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { Gamepad2, Heart, Home, Disc, Wrench } from 'lucide-react';

/**
 * Console options for the sidebar tabs dropdown.
 * Each console appears as an option in the switcher.
 */
export const consoleTabs = [
  {
    title: 'R36S',
    description: 'Console popular com RK3326',
    url: '/r36s',
  },
  {
    title: 'Miyoo Mini Plus',
    description: 'Compacto com OnionOS',
    url: '/miyoo-mini-plus',
  },
  {
    title: 'RG35XX',
    description: 'Anbernic design retrô',
    url: '/rg35xx',
  },
  {
    title: 'TrimUI Smart Brick',
    description: 'Compacto com tela 4:3',
    url: '/trimui-smart-brick',
  },
  {
    title: 'RG40XX H',
    description: 'Horizontal com HDMI e RGB',
    url: '/rg40xxh',
  },
  {
    title: 'PowKiddy',
    description: 'Tela 4:3 de alta qualidade',
    url: '/powkiddy',
  },
  {
    title: 'Retroid Pocket 5',
    description: 'Android com tela AMOLED 5.5"',
    url: '/retroid-pocket-5',
  },
  {
    title: 'Retroid Pocket Mini V2',
    description: 'Android compacto com AMOLED',
    url: '/retroid-pocket-mini-v2',
  },
  {
    title: 'Anbernic RG-406V',
    description: 'Android com tela 4:3 quadrada',
    url: '/rg-406v',
  },
  {
    title: 'Mangmi Air X',
    description: 'Android fino e leve',
    url: '/mangmi-air-x',
  },
  {
    title: 'Retroid Pocket 6',
    description: 'Android top de linha',
    url: '/retroid-pocket-6',
  },
];

/**
 * Base layout configuration shared across Home and Docs layouts.
 * Contains navigation, branding, and common UI options.
 */
export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <div className="flex items-center gap-2">
          <Gamepad2 className="size-5 text-primary" />
          <span className="font-bold">Retro Wiki</span>
        </div>
      ),
    },
    links: [
      {
        text: 'Início',
        url: '/',
        icon: <Home className="size-4" />,
      },
      {
        text: 'ROMs',
        url: '/roms',
        icon: <Disc className="size-4" />,
      },
      {
        text: 'Retro Tool',
        url: '/retro-tool',
        icon: <Wrench className="size-4" />,
      },
      {
        text: 'Apoie',
        url: '/apoie',
        icon: <Heart className="size-4" />,
      },
    ],
    githubUrl: 'https://github.com/dgateles/retrowiki',
  };
}

/**
 * Options for console-specific documentation layouts.
 * Includes console switcher tabs but minimal navigation links.
 */
export function consoleDocsOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <div className="flex items-center gap-2">
          <Gamepad2 className="size-5 text-primary" />
          <span className="font-bold">Retro Wiki</span>
        </div>
      ),
    },
    links: [],
  };
}
