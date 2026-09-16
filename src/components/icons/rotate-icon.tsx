import type { IconProps } from './type';
import { ICON_SIZE } from './constants';

export function RotateIcon(props: IconProps) {
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
      <path d="M12 3a7 7 0 0 1 7 7v4l-3 -3" />
      <path d="M22 11l-3 3" />
      <path d="M8 15.5l-5 -3l5 -3l5 3v5.5l-5 3l0 -5.5" />
      <path d="M3 12.5v5.5l5 3" />
      <path d="M8 15.545l5 -3.03" />
    </svg>
  );
}
