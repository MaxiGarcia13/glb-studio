import { Text } from '@/components/text';

interface ExportModalErrorProps {
  message: string;
}

export function ExportModalError({ message }: ExportModalErrorProps) {
  return (
    <Text
      as="div"
      variant="error"
      className="whitespace-pre-line"
      role="alert"
    >
      {message}
    </Text>
  );
}
