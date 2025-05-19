import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import type { TUsePDFSlickStore } from "@pdfslick/react";
import { select } from "d3-selection";
import { drag } from "d3-drag";
import Outline from "./Outline";
import Thumbnails from "./Thumbnails";
import ButtonsBar from "./ButtonsBar";
import Attachments from "./Attachments";

type ThumbsbarProps = {
  usePDFSlickStore: TUsePDFSlickStore;
  isThumbsbarOpen: boolean;
  thumbsRef: (instance: HTMLElement | null) => void;
};

const Thumbsbar = ({ usePDFSlickStore, isThumbsbarOpen, thumbsRef }: ThumbsbarProps) => {
  const [tab, setTab] = useState<"thumbnails" | "outline" | "attachments">("thumbnails");

  const containerRef = useRef<HTMLDivElement>(null);
  const resizerRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [width, setWidth] = useState(233);

  useEffect(() => {
    let newWidth = 0;

    const dragResize = drag<HTMLDivElement, unknown>()
      .on("start", () => {
        newWidth = containerRef.current?.clientWidth ?? 0;
        setIsResizing(true);
      })
      .on("drag", (e) => {
        newWidth += e.dx;
        const width = Math.min(620, Math.max(233, newWidth));
        setWidth(width);
      })
      .on("end", () => {
        setIsResizing(false);
      });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    select(resizerRef.current).call(dragResize as any);
  }, []);

  return (
    <>
      <div
        ref={containerRef}
        className={clsx(
          "h-full flex relative dark:bg-slate-700 dark:text-slate-200 dark:border-r-slate-500 bg-slate-50 border-r border-slate-300 [box-shadow:1px_0_2px_0_rgb(0_0_0_/_0.05)]",
          {
            visible: isThumbsbarOpen,
            "invisible border-r-0 overflow-hidden": !isThumbsbarOpen,
            "transition-all": !isResizing
          }
        )}
        style={{
          width: `${isThumbsbarOpen ? width : 0}px`
        }}
      >
        <ButtonsBar {...{ tab, setTab, isThumbsbarOpen, usePDFSlickStore }} />

        <div
          className={clsx("flex-1 relative", {
            "translate-x-0 visible opacity-100": isThumbsbarOpen,
            "transition-[visibility,opacity] delay-150 duration-300 ease-out": isThumbsbarOpen,
            "-translate-x-full invisible opacity-0": !isThumbsbarOpen
          })}
        >
          <Thumbnails {...{ show: tab === "thumbnails", thumbsRef, usePDFSlickStore }} />
          <Outline {...{ show: tab === "outline", usePDFSlickStore }} />
          <Attachments {...{ show: tab === "attachments", usePDFSlickStore }} />
        </div>
      </div>
      <div ref={resizerRef} className="hover:cursor-col-resize relative w-0">
        {isThumbsbarOpen && (
          <div
            className={clsx(
              "absolute -left-px top-0 h-full z-10 w-1 transition-all duration-150 ease-in hover:delay-150 hover:duration-150",
              {
                "dark:bg-blue-600 bg-blue-400": isResizing,
                "bg-transparent hover:dark:bg-blue-600 hover:bg-blue-400": !isResizing
              }
            )}
          />
        )}
      </div>
    </>
  );
};

export default Thumbsbar;
