import { cn } from '@maxigarcia/js-utils';
import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/button';
import { CloseIcon } from '@/components/icons/close-icon';
import { Text } from '@/components/text';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  /** Extra classes for the dialog panel. */
  className?: string;
}

export function Modal({ open, title, onClose, children, className }: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      panelRef.current?.focus();
    }
  }, [open]);

  if (!open || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-overlay cursor-pointer border-0"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'relative z-10 flex flex-col max-h-[min(90vh,42rem)] w-full max-w-3xl',
          'rounded-sm bg-surface border border-border shadow-xl outline-none text-fg',
          className,
        )}
      >
        <header className="flex items-center justify-between gap-4 px-4 py-2 border-b border-border shrink-0">
          <Text id={titleId} size="sm" variant="heading">
            {title}
          </Text>
          <Button onClick={onClose} variant="ghost" aria-label="Close" className="p-2">
            <CloseIcon />
          </Button>
        </header>
        <div className="flex-1 min-h-0 overflow-hidden p-4 flex flex-col">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
