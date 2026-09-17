export interface ActionMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  /** Native tooltip — use for disabled reasons. */
  title?: string;
  /** Trailing chord hint (e.g. ⌘Z). */
  shortcut?: string;
  /** Destructive action styling (e.g. Remove). */
  danger?: boolean;
  onSelect: () => void;
}
