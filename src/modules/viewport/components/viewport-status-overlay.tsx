import { useStore } from '@nanostores/react';
import { Text } from '@/components/text';
import { $model } from '@/modules/viewport/stores/model-store';

/**
 * Full-viewport status for idle / loading / hard error, plus a soft banner when
 * `phase === 'loaded'` but `$model.error` is set (skin failure, partial import, …).
 */
export function ViewportStatusOverlay() {
  const { phase, error } = useStore($model, { keys: ['phase', 'error'] });

  if (phase === 'loaded') {
    if (!error) {
      return null;
    }

    return (
      <div className="pointer-events-none absolute inset-x-0 bottom-20 z-20 flex justify-center px-4">
        <Text size="sm" variant="error" className="max-w-md text-center whitespace-pre-wrap">
          {error}
        </Text>
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-4">
      {phase === 'loading' && (
        <Text size="sm" variant="muted">
          Loading model…
        </Text>
      )}
      {phase === 'error' && error && (
        <Text size="sm" variant="error" className="max-w-md text-center">
          {error}
        </Text>
      )}
    </div>
  );
}
