// Brand-mark icons are no longer shipped by lucide-react 1.x. These minimal
// SVG React components match the lucide-react API (className, size, color,
// strokeWidth) so they can be used as drop-in replacements without changing
// the rest of the codebase.

import React from 'react';

const BASE_PROPS = {
  xmlns: 'http://www.w3.org/2000/svg',
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

function buildIcon(displayName, paths) {
  const Comp = React.forwardRef(function Icon(
    { size = 24, color, strokeWidth, className, ...rest },
    ref,
  ) {
    return (
      <svg
        ref={ref}
        {...BASE_PROPS}
        width={size}
        height={size}
        stroke={color ?? BASE_PROPS.stroke}
        strokeWidth={strokeWidth ?? BASE_PROPS.strokeWidth}
        className={className}
        aria-hidden="true"
        {...rest}
      >
        {paths}
      </svg>
    );
  });
  Comp.displayName = displayName;
  return Comp;
}

export const Instagram = buildIcon('Instagram', (
  <>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </>
));

export const Facebook = buildIcon('Facebook', (
  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
));
