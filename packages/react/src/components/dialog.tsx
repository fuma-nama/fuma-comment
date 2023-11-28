import { Transition, Dialog as Original } from "@headlessui/react";
import type { HTMLAttributes } from "react";
import { Fragment } from "react";
import { cn } from "../utils/cn";

interface DialogProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
}

export function Dialog({
  isOpen,
  onClose,
  children,
  className,
  ...props
}: DialogProps): JSX.Element {
  return (
    <Transition appear as={Fragment} show={isOpen}>
      <Original className="fc-relative fc-z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="fc-ease-out fc-duration-100"
          enterFrom="fc-opacity-0"
          enterTo="fc-opacity-100"
          leave="fc-ease-in fc-duration-100"
          leaveFrom="fc-opacity-100"
          leaveTo="fc-opacity-0"
        >
          <div className="fc-fixed fc-inset-0 fc-bg-background/50" />
        </Transition.Child>

        <div className="fc-fixed fc-inset-0 fc-flex fc-items-center fc-justify-center fc-overflow-y-auto fc-p-4">
          <Transition.Child
            as={Fragment}
            enter="fc-ease-out fc-duration-100"
            enterFrom="fc-opacity-0 fc-scale-95"
            enterTo="fc-opacity-100 fc-scale-100"
            leave="fc-ease-in fc-duration-100"
            leaveFrom="fc-opacity-100 fc-scale-100"
            leaveTo="fc-opacity-0 fc-scale-95"
          >
            <Original.Panel
              className={cn(
                "fc-flex fc-w-full fc-max-w-md fc-flex-col fc-rounded-2xl fc-bg-popover fc-p-4 fc-shadow-xl",
                className
              )}
              {...props}
            >
              {children}
            </Original.Panel>
          </Transition.Child>
        </div>
      </Original>
    </Transition>
  );
}

export const DialogTitle: typeof Original.Title = Original.Title;
