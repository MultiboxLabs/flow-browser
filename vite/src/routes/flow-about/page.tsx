import { ThemeProvider } from "@/components/main/theme";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";

function Page() {
  const hostnames = ["about", "about", "new-tab"];

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
            <CardTitle className="text-3xl font-bold">Flow URLs</CardTitle>
            <CardDescription>A list of available Flow browser URLs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {hostnames.map((hostname) => {
                const url = `flow://${hostname}`;
                return (
                  <div key={url} className="p-3 rounded-md bg-muted flex justify-between items-center">
                    <span className="text-foreground font-medium">{url}</span>
                    <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(url)}>
                      Copy
                    </Button>
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
    <ThemeProvider forceTheme="dark">
      <Page />
    </ThemeProvider>
  );
}
export default App;
