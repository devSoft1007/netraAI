import React, { useState, useRef, cloneElement, ReactElement } from "react";
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useHover,
  useFocus,
  useDismiss,
  useRole,
  useInteractions,
  FloatingPortal,
  arrow,
  useClick,
} from "@floating-ui/react";
import { Card } from "@/components/ui/card";

interface FloatingPopupProps {
  children: ReactElement;
  content: React.ReactNode;
  trigger?: "hover" | "click";
  placement?: "top" | "bottom" | "left" | "right";
  offset?: number;
  className?: string;
}

export default function FloatingPopup({
  children,
  content,
  trigger = "hover",
  placement = "top",
  offset: offsetValue = 8,
  className = "",
}: FloatingPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const arrowRef = useRef<HTMLDivElement>(null);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement,
    middleware: [
      offset(offsetValue),
      flip({
        fallbackAxisSideDirection: "start",
      }),
      shift({ padding: 5 }),
      arrow({
        element: arrowRef,
      }),
    ],
    whileElementsMounted: autoUpdate,
  });

  const hover = useHover(context, {
    enabled: trigger === "hover",
    delay: { open: 200, close: 100 },
  });
  
  const click = useClick(context, {
    enabled: trigger === "click",
  });
  
  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "tooltip" });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    click,
    focus,
    dismiss,
    role,
  ]);

  return (
    <>
      {cloneElement(children, {
        ref: refs.setReference,
        ...getReferenceProps(),
      })}
      
      {isOpen && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className="z-50"
          >
            <Card className={`p-4 shadow-lg border max-w-sm ${className}`}>
              {content}
            </Card>
            <div
              ref={arrowRef}
              className="absolute w-2 h-2 bg-white border rotate-45"
              style={{
                left: context.middlewareData.arrow?.x,
                top: context.middlewareData.arrow?.y,
              }}
            />
          </div>
        </FloatingPortal>
      )}
    </>
  );
}