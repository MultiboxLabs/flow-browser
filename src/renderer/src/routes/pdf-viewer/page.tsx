import { ThemeProvider } from "@/components/main/theme";
import { useQueryParam, StringParam } from "use-query-params";
import { PDFViewerApp } from "./pdf-viewer";

import "@pdfslick/react/dist/pdf_viewer.css";

function Page() {
  const [url] = useQueryParam("url", StringParam);
  if (!url) {
    return null;
  }

  const urlObject = URL.parse(url);
  urlObject?.searchParams.set("noflowredirect", "true");

  return <PDFViewerApp pdfFilePath={urlObject?.toString() ?? url} />;
}

function App() {
  return (
    <ThemeProvider>
      <Page />
    </ThemeProvider>
  );
}

export default App;
