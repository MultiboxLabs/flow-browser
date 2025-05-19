import { FC, useRef } from "react";
import { type TUsePDFSlickStore } from "@pdfslick/react";
import clsx from "clsx";

type AttachmentsProps = {
  usePDFSlickStore: TUsePDFSlickStore;
  show: boolean;
};

type AttachmentButtonProps = {
  usePDFSlickStore: TUsePDFSlickStore;
  filename: string;
  content: Uint8Array;
};

const AttachmentButton: FC<AttachmentButtonProps> = ({ usePDFSlickStore, filename, content }) => {
  const pdfSlick = usePDFSlickStore((s) => s.pdfSlick);
  const ref = useRef<HTMLButtonElement>(null);

  return (
    <button
      ref={ref}
      className="w-full box-border rounded text-left hover:dark:text-slate-100 hover:text-slate-900 p-1 hover:dark:bg-slate-600 hover:bg-slate-200"
      onClick={() => pdfSlick?.openOrDownloadData(content, filename)}
    >
      {filename}
    </button>
  );
};

const Attachments = ({ usePDFSlickStore, show }: AttachmentsProps) => {
  const attachments = usePDFSlickStore((s) => s.attachments);

  return (
    <div className={clsx("overflow-auto absolute inset-0", { invisible: !show })}>
      <div className="p-2 dark:text-slate-200 text-slate-700 text-sm">
        {Array.from(attachments.entries()).map(([key, { filename, content }]) => (
          <AttachmentButton key={key} {...{ usePDFSlickStore, filename, content }} />
        ))}
      </div>
    </div>
  );
};

export default Attachments;
