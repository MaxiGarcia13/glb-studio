import type { IconProps } from './type';
import { ICON_SIZE } from './constants';

export function ManIcon(props: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={ICON_SIZE}
      height={ICON_SIZE}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M10 16v5" />
      <path d="M14 16v5" />
      <path d="M9 9h6l-1 7h-4l-1 -7" />
      <path d="M5 11c1.333 -1.333 2.667 -2 4 -2" />
      <path d="M19 11c-1.333 -1.333 -2.667 -2 -4 -2" />
      <path d="M10 4a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
    </svg>
  );
}
