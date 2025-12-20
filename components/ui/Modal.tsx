import React, { ReactNode, useEffect, useRef } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

/**
 * Modal Component - Reusable dialog/popup with DaisyUI styling
 *
 * Features:
 * - Sizes: sm, md, lg, xl, fullscreen
 * - Backdrop click to close (optional)
 * - ESC key to close
 * - Title, body, footer sections
 * - Close button (optional)
 * - Responsive design
 *
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 *
 * <Modal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="ยืนยันการลบ"
 * >
 *   <p>คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?</p>
 *   <Modal.Actions>
 *     <Button onClick={() => setIsOpen(false)}>ยกเลิก</Button>
 *     <Button variant="error">ลบ</Button>
 *   </Modal.Actions>
 * </Modal>
 * ```
 */

export interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Modal title */
  title?: string;
  /** Modal content */
  children: ReactNode;
  /** Modal size */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen';
  /** Show close button in header */
  showCloseButton?: boolean;
  /** Allow closing by clicking backdrop */
  closeOnBackdrop?: boolean;
  /** Allow closing with ESC key */
  closeOnEscape?: boolean;
  /** Additional CSS classes for modal box */
  className?: string;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  className = '',
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Open/close dialog when isOpen changes
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    if (!closeOnEscape) return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };

    dialog.addEventListener('cancel', handleCancel);
    return () => dialog.removeEventListener('cancel', handleCancel);
  }, [closeOnEscape, onClose]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (!closeOnBackdrop) return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    // Check if click was on the backdrop (dialog itself, not its children)
    const rect = dialog.getBoundingClientRect();
    const isInDialog =
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom;

    if (!isInDialog) {
      onClose();
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'modal-box max-w-sm';
      case 'md':
        return 'modal-box max-w-md';
      case 'lg':
        return 'modal-box max-w-lg';
      case 'xl':
        return 'modal-box max-w-xl';
      case 'fullscreen':
        return 'modal-box w-11/12 max-w-5xl h-[90vh]';
      default:
        return 'modal-box';
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="modal modal-bottom sm:modal-middle"
      onClick={handleBackdropClick}
    >
      <div className={`${getSizeClasses()} ${className} animate-scale-in`}>
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between mb-4">
            {title && <h3 className="font-bold text-lg">{title}</h3>}
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4 btn-hover"
                aria-label="Close"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        {children}
      </div>

      {/* Backdrop */}
      <form method="dialog" className="modal-backdrop">
        <button type="button" onClick={onClose}>close</button>
      </form>
    </dialog>
  );
}

/**
 * Modal.Body - Modal body section with padding
 */
interface ModalBodyProps {
  children: ReactNode;
  className?: string;
}

Modal.Body = function ModalBody({ children, className = '' }: ModalBodyProps) {
  return <div className={`py-4 ${className}`}>{children}</div>;
};

/**
 * Modal.Actions - Modal actions/footer section (buttons)
 */
interface ModalActionsProps {
  children: ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

Modal.Actions = function ModalActions({
  children,
  className = '',
  align = 'right',
}: ModalActionsProps) {
  const getAlignClass = () => {
    switch (align) {
      case 'left':
        return 'justify-start';
      case 'center':
        return 'justify-center';
      case 'right':
      default:
        return 'justify-end';
    }
  };

  return (
    <div className={`modal-action ${getAlignClass()} ${className}`}>
      {children}
    </div>
  );
};
