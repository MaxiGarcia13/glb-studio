import type { IconProps } from '../type';

import { ICON_SIZE } from '../constants';

export function KeyboardShiftIcon(props: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={ICON_SIZE}
      height={ICON_SIZE}
      viewBox="0 0 64 64"
      fill="none"
      {...props}
    >
      <path fill="currentColor" d="M16 16 L48 16 Q56 16 56 24 L56 40 Q56 44.9 53 46.8 51.1 48 48 48 L16 48 Q12.9 48 11 46.8 8 44.9 8 40 L8 24 Q8 16 16 16 M11 24 L11 40 Q11 45 16 45 L48 45 Q53 45 53 40 L53 24 Q53 19 48 19 L16 19 Q11 19 11 24 M32 24 L40 32 40 34 36 34 36 40 28 40 28 34 24 34 24 32 32 24" />
    </svg>
  );
}
