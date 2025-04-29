import { GlobeIcon } from "lucide-react";
import { useState } from "react";

export function WebsiteFavicon({ url, favicon, className }: { url: string; favicon?: string; className?: string }) {
  const [useFlowUtility, setUseFlowUtility] = useState(true);
  const [useCustomFavicon, setUseCustomFavicon] = useState(false);

  if (useFlowUtility) {
    const srcUrl = new URL("flow://favicon");
    srcUrl.searchParams.set("url", url);
    return (
      <img
        src={srcUrl.toString()}
        alt="Favicon"
        className={className}
        onError={() => {
          setUseFlowUtility(false);
          if (favicon) {
            setUseCustomFavicon(true);
          }
        }}
      />
    );
  }

  if (useCustomFavicon && favicon) {
    return (
      <img
        src={favicon}
        alt="Favicon"
        className={className}
        onError={() => setUseCustomFavicon(false)}
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
      />
    );
  }

  return <GlobeIcon className={className} />;
}
