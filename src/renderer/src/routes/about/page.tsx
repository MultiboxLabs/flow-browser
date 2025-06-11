import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { copyTextToClipboard } from "@/lib/utils";
import { usePagesTranslations } from "@/lib/i18n";

function Page() {
  const { t: tPages } = usePagesTranslations();

  const hostnames = ["about", "new-tab", "games", "omnibox", "error", "extensions"];

  return (
    <div className="w-screen h-screen bg-background p-8 flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl w-full"
      >
        <Card className="border-border shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-bold">{tPages("about.title")}</CardTitle>
            <CardDescription>{tPages("about.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {hostnames.map((hostname) => {
                const url = `flow://${hostname}`;
                return (
                  <div key={url} className="p-3 rounded-md bg-muted flex justify-between items-center">
                    <span className="text-foreground font-medium">{url}</span>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => copyTextToClipboard(url)}>
                        Copy URL
                      </Button>
                      <Button variant="default" size="sm" onClick={() => window.open(url, "_blank")}>
                        Open
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function App() {
  return (
    <>
      <title>Flow URLs</title>
      <Page />
    </>
  );
}
export default App;
