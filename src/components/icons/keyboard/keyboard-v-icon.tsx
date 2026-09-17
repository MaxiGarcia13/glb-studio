import type { IconProps } from '../type';

import { ICON_SIZE } from '../constants';

export function KeyboardVIcon(props: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={ICON_SIZE}
      height={ICON_SIZE}
      viewBox="0 0 64 64"
      fill="none"
      {...props}
    >
      <path fill="currentColor" d="M38 22 L42 22 34 42 30 42 22 22 26 22 32 37 38 22 M11 16 L11 48 Q11 53 16 53 L48 53 Q53 53 53 48 L53 16 Q53 11 48 11 L16 11 Q11 11 11 16 M16 56 Q8 56 8 48 L8 16 Q8 8 16 8 L48 8 Q56 8 56 16 L56 48 Q56 56 48 56 L16 56" />
    </svg>
  );
}
