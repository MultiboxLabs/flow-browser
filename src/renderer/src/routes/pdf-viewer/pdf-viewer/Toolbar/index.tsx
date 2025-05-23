import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import {
  VscChevronDown,
  VscChevronUp,
  VscLayoutSidebarLeft,
  VscLayoutSidebarLeftOff,
  VscDesktopDownload
} from "@/components/react-icons/vsc";
import type { TUsePDFSlickStore } from "@pdfslick/react";
import ZoomSelector from "./ZoomSelector";
import InkMenu from "./InkMenu";
import FreetextMenu from "./FreetextMenu";
import DocumentInfo from "./DocumentInfo";
import MoreActionsMenu from "./MoreActionsMenu";
import Splitter from "./Splitter";
import Tooltip from "../Tooltip";
import SearchBar from "./SearchBar";

type TToolbarProps = {
  usePDFSlickStore: TUsePDFSlickStore;
  isThumbsbarOpen: boolean;
  setIsThumbsbarOpen: (s: boolean) => void;
};

const Toolbar = ({ usePDFSlickStore, isThumbsbarOpen, setIsThumbsbarOpen }: TToolbarProps) => {
  const pageNumberRef = useRef<HTMLInputElement>(null);

  const numPages = usePDFSlickStore((s) => s.numPages);
  const pageNumber = usePDFSlickStore((s) => s.pageNumber);
  const pdfSlick = usePDFSlickStore((s) => s.pdfSlick);

  const [wantedPageNumber, setWantedPageNumber] = useState<number | string>(1);

  const updatePageNumber = ({ pageNumber }: { pageNumber: number }) => setWantedPageNumber(pageNumber);

  useEffect(() => {
    updatePageNumber({ pageNumber });
  }, [pageNumber]);

  return (
    <>
      <div
        className={`w-full h-9 flex items-center justify-between dark:bg-slate-700 dark:text-slate-200 dark:border-b-slate-500 bg-slate-50 border-b border-b-slate-300 shadow-sm text-xs select-none sticky top-0 backdrop-blur z-10`}
      >
        <div className="px-1 flex items-center space-x-1">
          <button
            className={`enabled:hover:dark:bg-slate-600 enabled:hover:bg-slate-200 enabled:hover:text-black enabled:hover:dark:text-white dark:text-slate-300 text-slate-500 disabled:dark:text-slate-500 disabled:text-slate-300 p-1 rounded-sm transition-all group relative focus:border-blue-400 focus:ring-0 focus:shadow outline-none border border-transparent`}
            onClick={() => setIsThumbsbarOpen(!isThumbsbarOpen)}
          >
            {isThumbsbarOpen ? (
              <VscLayoutSidebarLeftOff className="h-4 w-4" />
            ) : (
              <VscLayoutSidebarLeft className="h-4 w-4" />
            )}
          </button>

          <Splitter />

          <ZoomSelector {...{ usePDFSlickStore }} />

          <Splitter />

          <button
            disabled={pageNumber <= 1}
            className="enabled:hover:dark:bg-slate-600 enabled:hover:bg-slate-200 enabled:hover:text-black enabled:hover:dark:text-white dark:text-slate-300 text-slate-500 disabled:dark:text-slate-500 disabled:text-slate-300 p-1 rounded-sm transition-all group relative focus:border-blue-400 focus:ring-0 focus:shadow outline-none border border-transparent"
            onClick={() => pdfSlick?.viewer?.previousPage()}
          >
            <VscChevronUp className="h-4 w-4" />
          </button>

          <button
            disabled={!pdfSlick || pageNumber >= numPages}
            className="enabled:hover:dark:bg-slate-600 enabled:hover:bg-slate-200 enabled:hover:text-black enabled:hover:dark:text-white dark:text-slate-300 text-slate-500 disabled:dark:text-slate-500 disabled:text-slate-300 p-1 rounded-sm transition-all group relative focus:border-blue-400 focus:ring-0 focus:shadow outline-none border border-transparent"
            onClick={() => pdfSlick?.viewer?.nextPage()}
          >
            <VscChevronDown className="h-4 w-4" />
          </button>

          <div className="hidden sm:flex items-center text-center space-x-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const newPageNumber = parseInt(wantedPageNumber + "");
                if (Number.isInteger(newPageNumber) && newPageNumber > 0 && newPageNumber <= numPages) {
                  pdfSlick?.linkService.goToPage(newPageNumber);
                } else {
                  setWantedPageNumber(pageNumber);
                }
              }}
            >
              <input
                ref={pageNumberRef}
                type="text"
                value={wantedPageNumber}
                className="block w-12 text-right rounded-sm border dark:bg-slate-600 dark:border-slate-500 dark:text-slate-200 dark:placeholder:text-slate-400 border-slate-300 focus:shadow focus:border-blue-400 focus:ring-0 outline-none text-xs p-1 px-1.5 placeholder:text-gray-300 focus:placeholder:text-gray-400 placeholder:italic"
                onFocus={() => pageNumberRef.current?.select()}
                onChange={(e) => {
                  setWantedPageNumber(e.currentTarget.value);
                }}
                onKeyDown={(e) => {
                  switch (e.key) {
                    case "Down": // IE/Edge specific value
                    case "ArrowDown":
                      pdfSlick?.linkService.goToPage(Math.min(numPages ?? 0, (pageNumber ?? 0) + 1));
                      break;
                    case "Up": // IE/Edge specific value
                    case "ArrowUp":
                      pdfSlick?.linkService.goToPage(Math.max(1, (pageNumber ?? 0) - 1));
                      break;
                    default:
                      return;
                  }
                }}
              />
            </form>
            <span> of {numPages}</span>
          </div>

          <Splitter />

          <SearchBar {...{ usePDFSlickStore }} />
        </div>

        <div className="px-1 space-x-1 flex items-center justify-end">
          <FreetextMenu {...{ usePDFSlickStore }} />
          <InkMenu {...{ usePDFSlickStore }} />

          <Splitter />

          <div className="items-center space-x-1 hidden sm:flex">
            <button
              className={clsx(
                "enabled:hover:dark:bg-slate-600 enabled:hover:bg-slate-200 enabled:hover:text-black enabled:hover:dark:text-white dark:text-slate-300 text-slate-500 disabled:dark:text-slate-500 disabled:text-slate-300 p-1 rounded-sm transition-all group relative focus:border-blue-400 focus:ring-0 focus:shadow outline-none border border-transparent"
              )}
              onClick={() => pdfSlick?.downloadOrSave()}
            >
              <VscDesktopDownload className="w-4 h-4" />
              <Tooltip position="bottom">
                <p className="whitespace-nowrap">Save</p>
              </Tooltip>
            </button>

            <DocumentInfo {...{ usePDFSlickStore }} />
            <Splitter />
          </div>

          <MoreActionsMenu {...{ usePDFSlickStore }} />
        </div>
      </div>
    </>
  );
};

export default Toolbar;
