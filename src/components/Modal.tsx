import React, {
  forwardRef,
  ForwardRefRenderFunction,
  useImperativeHandle,
  useState,
} from "react";

interface IModalProps {
  title?: JSX.Element | null;
  body: JSX.Element;
  footer?: JSX.Element | null;
  disableScroll?: boolean;
  transparent?: boolean;
  onClose?: () => void;
}
export interface ModalHandler {
  open: () => void;
  close: () => void;
  showModal: boolean;
}

const Modal: ForwardRefRenderFunction<ModalHandler, IModalProps> = (
  props,
  ref
) => {
  const [showModal, setShowModal] = useState(false);
  const { title, body, footer, disableScroll = false, transparent = false, onClose } = props;

  useImperativeHandle(
    ref,
    () => ({
      open: () => handleOpen(),
      close: () => handleClose(),
      showModal: showModal,
    }),
    [props]
  );

  const handleOpen = () => {
    setShowModal(true);
  };
  const handleClose = () => {
    setShowModal(false);
    if (onClose) onClose();
  };

  return (
    <>
      <div
        className={`modal ${showModal ? "modal-open" : ""} sm:modal-middle backdrop-blur-sm`}
        onClick={() => {
          setShowModal(false);
          if (onClose) onClose();
        }}
      >
        <div
          className={`modal-box relative p-0 max-w-lg w-[92%] sm:w-full flex flex-col max-h-[85vh] ${transparent ? "bg-transparent shadow-none overflow-visible" : "bg-white dark:bg-zinc-950 shadow-2xl overflow-hidden"}`}
          style={{ borderRadius: transparent ? '0' : '32px' }} // Force border radius
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {title ? (
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 shrink-0 z-20">
              {typeof title === 'string' ? <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3> : <div className="w-full pr-8">{title}</div>}
              <button
                onClick={() => {
                  setShowModal(false);
                  if (onClose) onClose();
                }}
                className="btn btn-sm btn-circle btn-ghost text-gray-500 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-900"
              >
                ✕
              </button>
            </div>
          ) : (
            <button onClick={() => {
              setShowModal(false);
              if (onClose) onClose();
            }} className="z-50 btn btn-sm btn-circle bg-white/80 dark:bg-zinc-900/80 hover:bg-white dark:hover:bg-zinc-900 text-gray-900 dark:text-white border-none shadow-sm absolute right-4 top-4 backdrop-blur-md">✕</button>
          )}

          {/* Body */}
          <div className={`flex-1 ${disableScroll ? "overflow-hidden flex flex-col" : "overflow-y-auto custom-scrollbar"}`}>
            {body}
          </div>

          {/* Footer */}
          {footer && (
            <div
              className="p-6 bg-white dark:bg-zinc-950 shrink-0 z-10 w-full"
              style={{ borderBottomLeftRadius: '32px', borderBottomRightRadius: '32px' }}
            >
              {footer}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
export default forwardRef(Modal);
