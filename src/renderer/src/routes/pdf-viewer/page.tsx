import { ThemeProvider } from "@/components/main/theme";
import { useQueryParam, StringParam } from "use-query-params";
import { PDFViewerApp } from "./pdf-viewer";
import { Fragment } from "react/jsx-runtime";

import "@pdfslick/react/dist/pdf_viewer.css";

// Theme makes it go all weird...
const THEME_PROVIDER_ENABLED = false;

function Page() {
  const [url] = useQueryParam("url", StringParam);
  if (!url) {
    return null;
  }

  return (
    <>
      <title>{url}</title>
      <PDFViewerApp pdfFilePath={url} />
    </>
  );
}

function App() {
  const ThemeProviderOrFragment = THEME_PROVIDER_ENABLED ? ThemeProvider : Fragment;

  return (
    <ThemeProviderOrFragment>
      <Page />
    </ThemeProviderOrFragment>
  );
}

export default App;
