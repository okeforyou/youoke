import React, {
    forwardRef,
    ForwardRefRenderFunction,
    useEffect,
    useImperativeHandle,
    useState,
} from 'react'

interface IAlertProps {
  icon: JSX.Element;
  headline: string;
  headlineColor: "text-green-600" | "text-red-600";
  content: JSX.Element;
  hideClose?: boolean;
  bgColor: "bg-green-100" | "bg-red-100";
  timer?: number;
}

export interface AlertHandler {
  open: () => void;
  close: () => void;
}

const Alert: ForwardRefRenderFunction<AlertHandler, IAlertProps> = (
  {
    icon,
    headline,
    headlineColor,
    hideClose,
    timer,
    bgColor,
    content,
  }: IAlertProps,
  ref
) => {
  const [isAlertOpen, setAlert] = useState(false);

  useImperativeHandle(ref, () => ({
    open() {
      setAlert(true);
    },
    close() {
      setAlert(false);
    },
  }));

  useEffect(() => {
    if (timer && isAlertOpen) {
      const timeId = setTimeout(() => {
        // After xx seconds set the show value to false, if exist timer as props
        setAlert(false);
      }, timer);

      return () => {
        clearTimeout(timeId);
      };
    }
  }, [timer, isAlertOpen]);

  const closeAlert = () => {
    setAlert(false);
  };

  return (
    <>
      <div
        className={`transition-opacity duration-200 ${
          isAlertOpen ? "opacity-100" : "opacity-0"
        } ${
          isAlertOpen ? "" : "hidden"
        } fixed max-w-fit top-0 right-0 left-0 mx-auto mt-4 z-50`}
      >
        <div className={`relative flex w-full rounded-lg py-4 px-8 ${bgColor}`}>
          {!hideClose && (
            <div
              role="button"
              className="absolute rounded-lg p-1 right-0 top-0 mr-2 mt-2"
              onClick={closeAlert}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </div>
          )}

          <div className={`flex w-8 h-8 ${headlineColor}`}>{icon}</div>
          <div className="px-2">
            <span className={`mb-2 font-bold ${headlineColor}`}>
              {headline}
            </span>
            <div>{content}</div>
          </div>
        </div>
      </div>
    </>
  );
};

Alert.displayName = "Alert";

export default forwardRef(Alert);
