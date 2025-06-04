import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { useState } from "react";
import { copyTextToClipboard } from "@/lib/utils";

// Define the Game type (can be inferred, but explicit is clearer)
interface Game {
  name: string;
  description: string;
  url: string;
  category: string;
  icon: string;
}

// Props for the new GameCard component
interface GameCardProps {
  game: Game;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

// The new GameCard component
function GameCard({ game, isHovered, onMouseEnter, onMouseLeave }: GameCardProps) {
  return (
    <motion.div
      key={game.url}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.03 }}
      transition={{ duration: 0.3 }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`p-4 rounded-lg flex items-start gap-4 transition-colors ${isHovered ? "bg-primary/10" : "bg-muted"} border-border border`}
    >
      <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center text-2xl bg-primary/20 rounded-md">
        {game.icon}
      </div>
      <div className="flex-grow space-y-2">
        <div>
          <h3 className="text-foreground font-medium text-lg">{game.name}</h3>
          <p className="text-muted-foreground text-sm">{game.description}</p>
        </div>
        <div className="flex space-x-2 pt-1">
          <Button variant="outline" size="sm" onClick={() => copyTextToClipboard(game.url)} className="text-xs">
            Copy URL
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => window.open(game.url, "_blank")}
            className="text-xs bg-primary hover:bg-primary/90"
          >
            Play Now
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function Page() {
  const [hoveredGame, setHoveredGame] = useState<string | null>(null);

  const games: Game[] = [
    {
      name: "Chrome Dino",
      description: "The famous Chrome offline dinosaur game",
      url: "flow-external://dino.chrome.game",
      category: "Classic",
      icon: "🦖"
    },
    {
      name: "Edge Surf (v1)",
      description: "The classic surf game from Microsoft Edge",
      url: "flow-external://v1.surf.edge.game",
      category: "Classic",
      icon: "🏄"
    },
    {
      name: "Edge Surf (v2)",
      description: "The surf game from Microsoft Edge",
      url: "flow-external://v2.surf.edge.game",
      category: "Classic",
      icon: "🌊"
    }
  ];

  const categories = [...new Set(games.map((game) => game.category))];

  return (
    <div className="w-screen h-screen bg-background p-8 flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl w-full"
      >
        <Card className="border-border shadow-lg overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/20 to-transparent rounded-full blur-3xl -z-10"
          />
          <CardHeader className="border-b border-border/40">
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent">
              Flow Games
            </CardTitle>
            <CardDescription className="text-lg">
              Explore a collection of offline games available in Flow
            </CardDescription>
          </CardHeader>
          <CardContent>
            {categories.map((category) => (
              <div key={category} className="mb-6">
                <h2 className="text-xl font-semibold mb-3 text-foreground/80">{category} Games</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {games
                    .filter((game) => game.category === category)
                    .map((game) => (
                      <GameCard
                        key={game.url}
                        game={game}
                        isHovered={hoveredGame === game.url}
                        onMouseEnter={() => setHoveredGame(game.url)}
                        onMouseLeave={() => setHoveredGame(null)}
                      />
                    ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function App() {
  return (
    <>
      <title>Flow Games</title>
      <Page />
    </>
  );
}
export default App;
