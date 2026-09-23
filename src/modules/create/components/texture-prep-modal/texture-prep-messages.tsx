import { Text } from '@/components/text';
import { TEXTURE_PREP_GUIDANCE } from '@/modules/create/domain/color-map/texture-prep-guidance';

interface TexturePrepMessagesProps {
  error: string | null;
  warnings: string[];
}

/** Persistent upload guidance plus hard errors and soft warnings. */
export function TexturePrepMessages({
  error,
  warnings,
}: TexturePrepMessagesProps) {
  return (
    <>
      <Text as="p" variant="muted" role="note">
        {TEXTURE_PREP_GUIDANCE}
      </Text>

      {error
        ? (
            <Text as="p" variant="error" role="alert">
              {error}
            </Text>
          )
        : null}

      {warnings.length > 0
        ? (
            <ul className="flex flex-col gap-2" aria-label="Texture warnings">
              {warnings.map((warning) => (
                <Text
                  key={warning}
                  as="li"
                  className="text-warning"
                >
                  {warning}
                </Text>
              ))}
            </ul>
          )
        : null}
    </>
  );
}
