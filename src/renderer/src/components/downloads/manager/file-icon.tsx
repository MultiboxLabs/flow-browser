import { FileText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { DownloadRecord } from "~/types/downloads";

export function DownloadFileIcon({
  record,
  className,
  imageClassName,
  fallbackClassName,
  size = "normal"
}: {
  record: DownloadRecord;
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
  size?: "small" | "normal" | "large";
}) {
  const [hasError, setHasError] = useState(false);

  const src = useMemo(() => {
    if (!record.savePath && !record.suggestedFilename) return null;

    const iconUrl = new URL("flow://file-icon");
    if (record.savePath) {
      iconUrl.searchParams.set("path", record.savePath);
    } else {
      iconUrl.searchParams.set("name", record.suggestedFilename);
    }
    iconUrl.searchParams.set("size", size);
    return iconUrl.toString();
  }, [record.savePath, record.suggestedFilename, size]);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  return (
    <div className={className}>
      {!src || hasError ? (
        <FileText className={fallbackClassName} />
      ) : (
        <img
          src={src}
          alt=""
          aria-hidden="true"
          className={imageClassName}
          draggable={false}
          onError={() => setHasError(true)}
        />
      )}
    </div>
  );
}
