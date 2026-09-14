export interface ActionMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  /** Destructive action styling (e.g. Remove). */
  danger?: boolean;
  onSelect: () => void;
}
