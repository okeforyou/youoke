import React, {
  forwardRef,
  ForwardRefRenderFunction,
  useImperativeHandle,
  useState,
} from "react";

interface IModalProps {
  title: JSX.Element;
  body: JSX.Element;
  footer: JSX.Element;
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
  const { title, body, footer } = props;

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
  };

  return (
    <>
      {showModal ? (
        <>
          <div
            className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none"
            onClick={() => setShowModal(false)}
          >
            <div className="relative w-auto my-6 mx-auto max-w-xl">
              {/*content*/}
              <div
                className="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                {/*header*/}
                <div className="flex items-start justify-between p-5">
                  <h3 className="text-xl font-semibold">{title}</h3>
                  <button
                    className="p-1 ml-auto bg-transparent border-0 float-right text-3xl leading-none font-semibold outline-none focus:outline-none"
                    onClick={() => setShowModal(false)}
                  >
                    <span className="h-6 w-6 text-2xl block outline-none focus:outline-none">
                      ×
                    </span>
                  </button>
                </div>
                {/*body*/}
                {body}
                {/*footer*/}
                <div className="flex items-center justify-end p-4  rounded-b">
                  {footer}
                </div>
              </div>
            </div>
          </div>
          <div className="opacity-25 fixed inset-0 z-40 bg-black"></div>
        </>
      ) : null}
    </>
  );
};
export default forwardRef(Modal);
