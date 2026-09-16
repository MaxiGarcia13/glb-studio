import type { IconProps } from './type';
import { ICON_SIZE } from './constants';

export function UnlinkIcon(props: IconProps) {
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
      <path d="M10 14a3.5 3.5 0 0 0 5 0l3 -3a3.5 3.5 0 0 0 -5 -5l-.5 .5" />
      <path d="M14 10a3.5 3.5 0 0 0 -5 0l-3 3a3.5 3.5 0 0 0 5 5l.5 -.5" />
      <path d="M16 21l0 -2" />
      <path d="M19 16l2 0" />
      <path d="M3 8l2 0" />
      <path d="M8 3l0 2" />
    </svg>
  );
}
