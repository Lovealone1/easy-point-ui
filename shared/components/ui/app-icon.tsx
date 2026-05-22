"use client";

import * as React from 'react';
import { Icon, addCollection, type IconProps } from '@iconify/react';
import materialSymbolsData from '@iconify-json/material-symbols/icons.json';
import { ICON_CONFIG } from '@/shared/config/icons.config';
import { cn } from '@/shared/lib/utils';

// Register the Material Symbols collection locally so icons render offline
// (no CDN requests) and work in SSR / production builds.
let _collectionAdded = false;
function ensureCollection() {
  if (_collectionAdded) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addCollection(materialSymbolsData as any);
  _collectionAdded = true;
}

export interface AppIconProps extends Omit<IconProps, 'icon'> {
  /**
   * The name of the icon.
   * Can be a simple name like "home" (uses default configured prefix, e.g. "material-symbols:home"),
   * or a fully qualified icon name like "tabler:home" to override the default prefix.
   */
  name: string;
}

/**
 * AppIcon Component
 * A flexible wrapper around Iconify React that dynamically prepends a global,
 * customizable icon set prefix. Icons are served from the locally installed
 * @iconify-json/material-symbols package — no CDN required.
 */
export const AppIcon = React.forwardRef<SVGSVGElement, AppIconProps>(
  ({ name, className, ...props }, ref) => {
    ensureCollection();

    // If the name contains a colon, treat it as a fully qualified icon name
    const iconName = name.includes(':')
      ? name
      : `${ICON_CONFIG.defaultPrefix}:${name}`;

    return (
      <Icon
        ref={ref}
        icon={iconName}
        className={cn('inline-block shrink-0', className)}
        {...props}
      />
    );
  }
);

AppIcon.displayName = 'AppIcon';
