import { Text } from '@/components/text';
import { labelOffset } from './utils';

interface TimelineRulerProps {
  majorFrames: number[];
  totalFrames: number;
}

export function TimelineRuler({ majorFrames, totalFrames }: TimelineRulerProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-4">
      {majorFrames.map((frame) => (
        <Text
          key={`label-${frame}`}
          variant="numeric"
          className="absolute top-0 text-fg-muted"
          style={{
            left: `${(frame / totalFrames) * 100}%`,
            transform: labelOffset(frame, totalFrames),
          }}
        >
          {frame}
        </Text>
      ))}
    </div>
  );
}
