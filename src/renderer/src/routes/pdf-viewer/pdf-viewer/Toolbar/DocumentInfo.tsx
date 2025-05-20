import { useState } from "react";
import type { TUsePDFSlickStore } from "@pdfslick/react";
import { VscInfo } from "@/components/react-icons/vsc";
import DocumentInfoModal from "./DocumentInfoModal";
import Tooltip from "../Tooltip";

type DocumentInfoProps = {
  usePDFSlickStore: TUsePDFSlickStore;
};

export default function DocumentInfo({ usePDFSlickStore }: DocumentInfoProps) {
  const [isOpen, setIsOpen] = useState(false);

  function closeModal() {
    setIsOpen(false);
  }

  function openModal() {
    setIsOpen(true);
  }

  return (
    <>
      <button
        className={`enabled:hover:dark:bg-slate-600 enabled:hover:bg-slate-200 enabled:hover:text-black enabled:hover:dark:text-white dark:text-slate-300 text-slate-500 disabled:dark:text-slate-500 disabled:text-slate-300 p-1 rounded-sm transition-all group relative focus:border-blue-400 focus:ring-0 focus:shadow outline-none border border-transparent`}
        onClick={() => {
          openModal();
        }}
      >
        <VscInfo className="w-4 h-4" />
        <Tooltip position="bottom" alignX="right">
          <p className="whitespace-nowrap">Document Properties</p>
        </Tooltip>
      </button>

      <DocumentInfoModal {...{ usePDFSlickStore, isOpen, closeModal }} />
    </>
  );
}
