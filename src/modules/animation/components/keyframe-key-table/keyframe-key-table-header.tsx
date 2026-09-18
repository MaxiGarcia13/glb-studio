import { Text } from '@/components/text';
import { keyframeKeyGridTemplate } from './keyframe-key-grid';

interface KeyframeKeyTableHeaderProps {
  valueSize: number;
  valueChannels: readonly { channel: number; label: string }[];
}

export function KeyframeKeyTableHeader({
  valueSize,
  valueChannels,
}: KeyframeKeyTableHeaderProps) {
  return (
    <div
      className="grid gap-2 text-fg-muted"
      style={{ gridTemplateColumns: keyframeKeyGridTemplate(valueSize) }}
    >
      <Text variant="muted">#</Text>
      <Text variant="muted">Time</Text>
      {valueChannels.map(({ label }) => (
        <Text key={label} variant="muted">
          {label}
        </Text>
      ))}
      <span className="sr-only">Delete</span>
    </div>
  );
}
