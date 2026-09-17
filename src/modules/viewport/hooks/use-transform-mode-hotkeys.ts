import { useEffect } from 'react';

import { isTypingTarget } from '@/modules/commands';

import { setTransformMode } from '../stores/transform-mode-store';

/** Blender-style W / E / R → translate / rotate / scale. */
export function useTransformModeHotkeys(): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) {
        return;
      }
      if (isTypingTarget(event.target)) {
        return;
      }

      const key = event.key.toLowerCase();
      if (key === 'w') {
        event.preventDefault();
        setTransformMode('translate');
      } else if (key === 'e') {
        event.preventDefault();
        setTransformMode('rotate');
      } else if (key === 'r') {
        event.preventDefault();
        setTransformMode('scale');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
