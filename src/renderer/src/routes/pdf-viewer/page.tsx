import { useQueryParam, StringParam } from "use-query-params";
import { PDFViewerApp } from "./pdf-viewer";

import "@pdfslick/react/dist/pdf_viewer.css";

function Page() {
  const [url] = useQueryParam("url", StringParam);
  const [cacheURL] = useQueryParam("cacheURL", StringParam);
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
