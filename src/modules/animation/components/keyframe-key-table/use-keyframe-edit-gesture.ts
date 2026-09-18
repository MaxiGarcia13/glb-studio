import type { SaveKeyframeClipSlice } from '@/modules/animation/types/undo-stack';
import { useRef } from 'react';
import {
  captureKeyframeEditSnapshot,
  finalizeKeyframeEdit,
  updateClipKeyframe,
} from '@/modules/animation/stores/clip-store';
import { selectKeyframeKey } from '@/modules/animation/stores/keyframe-ui-store';

/**
 * Coalesce live key field edits into one undo entry per focus gesture
 * (same pattern as trim inputs).
 */
export function useKeyframeEditGesture(trackName: string) {
  const undoFromRef = useRef<SaveKeyframeClipSlice | null>(null);
  const dirtyRef = useRef(false);

  const captureUndoFrom = () => {
    if (undoFromRef.current === null) {
      undoFromRef.current = captureKeyframeEditSnapshot();
    }
  };

  const commitUndo = () => {
    const undoFrom = undoFromRef.current;
    const dirty = dirtyRef.current;
    undoFromRef.current = null;
    dirtyRef.current = false;
    if (!dirty) {
      return;
    }
    finalizeKeyframeEdit(undoFrom);
  };

  const applyLivePatch = (
    keyIndex: number,
    patch: { time?: number; values?: number[] },
  ) => {
    captureUndoFrom();
    dirtyRef.current = true;
    const result = updateClipKeyframe(trackName, keyIndex, patch, {
      recordUndo: false,
    });
    if (result) {
      selectKeyframeKey(result.keyIndex);
    }
  };

  return { captureUndoFrom, commitUndo, applyLivePatch };
}
