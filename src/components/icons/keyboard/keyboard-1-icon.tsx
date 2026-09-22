import type { IconProps } from '../type';
import { ICON_SIZE } from '../constants';

export function Keyboard1Icon(props: IconProps) {
  return (
    <svg
      width={ICON_SIZE}
      height={ICON_SIZE}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      {...props}
    >
      <defs />
      <g>
        <path stroke="none" fill="currentColor" d="M16 8 L48 8 Q56 8 56 16 L56 48 Q56 56 48 56 L16 56 Q8 56 8 48 L8 16 Q8 8 16 8 M11 16 L11 48 Q11 53 16 53 L48 53 Q53 53 53 48 L53 16 Q53 11 48 11 L16 11 Q11 11 11 16 M35 24 L35 41 31 41 31 33.95 31 33.85 31 28.95 28 28.95 28 27 31 24 35 24" />
      </g>
    </svg>
  );
}
