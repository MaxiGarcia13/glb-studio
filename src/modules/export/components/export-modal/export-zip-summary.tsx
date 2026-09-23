import type { ExportFormat } from '@/modules/export/utils/file-name';
import { Text } from '@/components/text';
import { formatLabel } from './format-label';

interface ExportZipSummaryProps {
  format: ExportFormat;
  groupCount: number;
  singleCount: number;
  sharedCount: number;
  exportAsFolders: boolean;
}

export function ExportZipSummary({
  format,
  groupCount,
  singleCount,
  sharedCount,
  exportAsFolders,
}: ExportZipSummaryProps) {
  const summaryParts: string[] = [];
  if (groupCount > 0) {
    summaryParts.push(
      `${groupCount} grouped ${formatLabel(format, groupCount !== 1)}`,
    );
  }
  if (singleCount > 0) {
    summaryParts.push(
      `${singleCount} ${singleCount === 1 ? 'model' : 'models'}`,
    );
  }
  if (sharedCount > 0) {
    summaryParts.push(
      `${sharedCount} shared animation ${sharedCount === 1 ? 'file' : 'files'}`,
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Text as="h2" variant="section">
        Zip contents
      </Text>
      <Text variant="muted">
        {summaryParts.length > 0
          ? summaryParts.join(' · ')
          : 'Nothing to pack yet'}
      </Text>
      {groupCount > 0 && (
        <Text size="sm" variant="muted">
          {`Model groups pack as one ${formatLabel(format, false)} each (namespaced bones + each model’s owned clips). Shared animations stay separate. Ungrouped models stay separate.`}
        </Text>
      )}
      {exportAsFolders && singleCount > 0
        ? (
            <Text size="sm" variant="muted">
              Folder layout nests each ungrouped model with animations/ and skins/ sidecars.
            </Text>
          )
        : null}
    </div>
  );
}
