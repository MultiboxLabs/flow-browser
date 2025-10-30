import { useQueryState } from "nuqs";
import { PDFViewerApp } from "./pdf-viewer";

import "@pdfslick/react/dist/pdf_viewer.css";

function Page() {
  const [url] = useQueryState("url");
  const [cacheURL] = useQueryState("cacheURL");
  if (!url) {
    return null;
  }

  return (
    <>
      <title>{url}</title>
      <PDFViewerApp pdfFilePath={cacheURL ?? url} />
    </>
  );
}

export default Page;
