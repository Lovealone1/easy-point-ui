"use client";

import * as React from 'react';
import { Icon, type IconProps } from '@iconify/react';
import { ICON_CONFIG } from '@/shared/config/icons.config';
import { cn } from '@/shared/lib/utils';

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
 * customizable icon set prefix.
 */
export const AppIcon = React.forwardRef<SVGSVGElement, AppIconProps>(
  ({ name, className, ...props }, ref) => {
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
