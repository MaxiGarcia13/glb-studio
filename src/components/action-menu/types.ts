export interface ActionMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  /** Native tooltip — use for disabled reasons. */
  title?: string;
  /** Destructive action styling (e.g. Remove). */
  danger?: boolean;
  onSelect: () => void;
}
