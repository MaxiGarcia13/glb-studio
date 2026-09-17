import type { KeyboardKeyId } from '../types/keyboard-key-id';
import type { IconProps } from '@/components/icons/type';
import {
  KeyboardArrowDownIcon,
  KeyboardArrowLeftIcon,
  KeyboardArrowRightIcon,
  KeyboardArrowUpIcon,
  KeyboardBIcon,
  KeyboardCIcon,
  KeyboardCommandIcon,
  KeyboardCtrlIcon,
  KeyboardDeleteIcon,
  KeyboardEIcon,
  KeyboardQIcon,
  KeyboardRIcon,
  KeyboardShiftIcon,
  KeyboardSIcon,
  KeyboardSpaceIcon,
  KeyboardVIcon,
  KeyboardWIcon,
  KeyboardYIcon,
  KeyboardZIcon,
} from '@/components/icons/keyboard';

export const KEYBOARD_KEY_ICONS: Record<
  KeyboardKeyId,
  (props: IconProps) => React.ReactNode
> = {
  command: KeyboardCommandIcon,
  ctrl: KeyboardCtrlIcon,
  shift: KeyboardShiftIcon,
  space: KeyboardSpaceIcon,
  q: KeyboardQIcon,
  w: KeyboardWIcon,
  e: KeyboardEIcon,
  r: KeyboardRIcon,
  b: KeyboardBIcon,
  s: KeyboardSIcon,
  c: KeyboardCIcon,
  v: KeyboardVIcon,
  z: KeyboardZIcon,
  y: KeyboardYIcon,
  arrow_left: KeyboardArrowLeftIcon,
  arrow_right: KeyboardArrowRightIcon,
  arrow_up: KeyboardArrowUpIcon,
  arrow_down: KeyboardArrowDownIcon,
  delete: KeyboardDeleteIcon,
};
