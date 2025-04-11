import { ThemeProvider } from "@/components/main/theme";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";

function Page() {
  const games = [
    {
      name: "Surf Game",
      description: "The classic surf game from Microsoft Edge",
      url: "flow-external://surf.edge.game"
    },
    {
      name: "Dino Game",
      description: "The famous Chrome offline dinosaur game",
      url: "flow-external://dino.chrome.game"
    }
  ];

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
            <CardTitle className="text-3xl font-bold">Flow Games</CardTitle>
            <CardDescription>Offline games available in Flow</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {games.map((game) => (
                <div key={game.url} className="p-4 rounded-md bg-muted flex justify-between items-center">
                  <div className="space-y-1">
                    <h3 className="text-foreground font-medium text-lg">{game.name}</h3>
                    <p className="text-muted-foreground text-sm">{game.description}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(game.url)}>
                      Copy URL
                    </Button>
                    <Button variant="default" size="sm" onClick={() => window.open(game.url, "_blank")}>
                      Play
                    </Button>
                  </div>
                </div>
              ))}
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
