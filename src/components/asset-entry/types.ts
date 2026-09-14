export type AssetStatus = 'ready' | 'error';

export type AssetEntryVariant = 'card' | 'row';

export interface AssetEntryPrimaryAction {
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  onSelect: () => void;
}

export interface AssetEntryProps {
  label: string;
  title?: string;
  /** Icon rendered before the label. */
  leading?: React.ReactNode;
  /** Secondary line under the name (source file, short error, etc.). */
  description?: string | null;
  /** Full error text for tooltip when description is a short summary. */
  errorDetail?: string | null;
  status?: AssetStatus;
  statusLabel?: string;
  onReplace: () => void;
  onRemove: () => void;
  replaceDisabled?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  /** Optional leading overflow-menu action (e.g. Retarget). */
  primaryAction?: AssetEntryPrimaryAction;
  /** When provided, the label can be renamed inline (commit on Enter/blur, cancel on Escape). */
  onRename?: (name: string) => void;
  /**
   * `row` — compact outliner-style row (library tree).
   * `card` — padded ringed card.
   * Defaults to `row`.
   */
  variant?: AssetEntryVariant;
}
