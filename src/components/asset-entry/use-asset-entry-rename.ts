import { useCallback, useLayoutEffect, useRef, useState } from 'react';

import { renameSelectionEnd } from './rename-selection';

interface UseAssetEntryRenameOptions {
  label: string;
  onRename?: (name: string) => void;
}

export interface UseAssetEntryRenameResult {
  canRename: boolean;
  editing: boolean;
  draft: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  setDraft: (value: string) => void;
  startEditing: () => void;
  commit: () => void;
  cancel: () => void;
}

export function useAssetEntryRename({
  label,
  onRename,
}: UseAssetEntryRenameOptions): UseAssetEntryRenameResult {
  const canRename = onRename !== undefined;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(label);
  const inputRef = useRef<HTMLInputElement>(null);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  useLayoutEffect(() => {
    if (!editing) {
      return;
    }
    const input = inputRef.current;
    if (!input) {
      return;
    }
    input.focus();
    // Finder-style: select basename only; leave .glb/.gltf unselected but editable.
    input.setSelectionRange(0, renameSelectionEnd(label));
    // Intentionally omit `label` from deps: only select when entering edit mode.
  }, [editing]);

  const startEditing = useCallback((): void => {
    setDraft(label);
    setEditing(true);
  }, [label]);

  const commit = useCallback((): void => {
    if (!canRename || !onRename) {
      return;
    }
    const trimmed = draftRef.current.trim();
    if (trimmed && trimmed !== label) {
      onRename(trimmed);
    }
    setEditing(false);
  }, [canRename, onRename, label]);

  const cancel = useCallback((): void => {
    setDraft(label);
    setEditing(false);
  }, [label]);

  return {
    canRename,
    editing,
    draft,
    inputRef,
    setDraft,
    startEditing,
    commit,
    cancel,
  };
}
