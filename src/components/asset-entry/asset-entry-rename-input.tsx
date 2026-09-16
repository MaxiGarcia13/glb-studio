interface AssetEntryRenameInputProps {
  inputRef: React.RefObject<HTMLInputElement | null>;
  value: string;
  onChange: (value: string) => void;
  onCommit: () => void;
  onCancel: () => void;
}

export function AssetEntryRenameInput({
  inputRef,
  value,
  onChange,
  onCommit,
  onCancel,
}: AssetEntryRenameInputProps) {
  return (
    <input
      ref={inputRef}
      value={value}
      onChange={(event) => onChange(event.currentTarget.value)}
      onBlur={onCommit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          onCommit();
        } else if (event.key === 'Escape') {
          onCancel();
        }
      }}
      aria-label="Rename"
      className="w-full min-w-0 rounded-sm bg-control px-2 py-2 text-xs text-fg"
    />
  );
}
