import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { parseAddressBarInput } from "@/lib/url";
import { Search, Plus, X, Save, Trash2, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeProvider, useTheme } from "@/components/main/theme";
import { WebsiteFavicon } from "@/components/main/website-favicon";

// This interface will help with type safety for the quick links
interface QuickLink {
  id: string;
  name: string;
  url: string;
  favicon?: string;
  extraClass?: string;
}

function Page() {
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [quickLinks, setQuickLinks] = useState<QuickLink[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newLinkName, setNewLinkName] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");

  // Default quicklinks
  const defaultQuickLinks: QuickLink[] = [
    {
      id: "google",
      name: "Google",
      url: "https://www.google.com",
      favicon: "https://www.google.com/favicon.ico"
    },
    {
      id: "youtube",
      name: "YouTube",
      url: "https://www.youtube.com",
      favicon: "https://www.youtube.com/favicon.ico"
    },
    {
      id: "github",
      name: "GitHub",
      url: "https://github.com",
      favicon: "https://github.com/favicon.ico"
    },
    {
      id: "gmail",
      name: "Gmail",
      url: "https://mail.google.com",
      favicon: "https://www.google.com/gmail/about/static/images/logo-gmail.png"
    },
    {
      id: "x",
      name: "X",
      url: "https://x.com",
      favicon: "https://x.com/favicon.ico"
    },
    {
      id: "reddit",
      name: "Reddit",
      url: "https://reddit.com",
      favicon: "https://reddit.com/favicon.ico"
    },
    {
      id: "netflix",
      name: "Netflix",
      url: "https://netflix.com",
      favicon: "https://www.netflix.com/favicon.ico"
    },
    {
      id: "spotify",
      name: "Spotify",
      url: "https://spotify.com",
      favicon: "https://open.spotifycdn.com/cdn/images/favicon.0f31d2ea.ico"
    }
  ];

  // Load quicklinks from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const savedLinks = localStorage.getItem("quickLinks");
    if (savedLinks) {
      try {
        const parsedLinks = JSON.parse(savedLinks);
        setQuickLinks(parsedLinks);
      } catch (error) {
        console.error("Failed to parse saved links:", error);
        setQuickLinks(defaultQuickLinks);
      }
    } else {
      setQuickLinks(defaultQuickLinks);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save quicklinks to localStorage when they change
  useEffect(() => {
    if (mounted && quickLinks.length > 0) {
      localStorage.setItem("quickLinks", JSON.stringify(quickLinks));
    }
  }, [quickLinks, mounted]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Use the parseAddressBarInput utility function to handle URL parsing
      const url = parseAddressBarInput(searchQuery);
      if (url) {
        window.location.href = url;
      }
    }
  };

  const toggleTheme = () => {
    // If current theme is system, set to explicit light/dark based on current resolved theme
    // Otherwise toggle between light and dark
    const newTheme =
      theme === "system" ? (resolvedTheme === "dark" ? "light" : "dark") : theme === "dark" ? "light" : "dark";
    console.log(`Switching theme from ${theme} to ${newTheme}`);
    setTheme(newTheme);
  };

  const handleAddLink = () => {
    if (newLinkName.trim() && newLinkUrl.trim()) {
      // Ensure URL has http:// or https:// prefix
      let url = newLinkUrl;
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = "https://" + url;
      }

      const newLink: QuickLink = {
        id: Date.now().toString(),
        name: newLinkName,
        url: url
      };

      setQuickLinks([...quickLinks, newLink]);
      setNewLinkName("");
      setNewLinkUrl("");
      setIsAddDialogOpen(false);
    }
  };

  const handleDeleteLink = (id: string) => {
    setQuickLinks(quickLinks.filter((link) => link.id !== id));
  };

  const handleResetToDefaults = () => {
    setQuickLinks(defaultQuickLinks);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsAddDialogOpen(open);
    if (!open) {
      // Reset form when dialog is closed
      setNewLinkName("");
      setNewLinkUrl("");
    }
  };

  if (!mounted) {
    // Return a placeholder or skeleton to avoid hydration mismatch
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-900"></div>;
  }

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 text-gray-800 dark:text-white p-4 md:p-8 font-sans transition-colors duration-300 select-none">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 text-center relative w-full"
      >
        <button
          onClick={toggleTheme}
          type="button"
          className="absolute right-0 top-0 p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
        >
          {resolvedTheme === "dark" ? (
            <Sun className="h-5 w-5 text-yellow-400" />
          ) : (
            <Moon className="h-5 w-5 text-gray-700" />
          )}
        </button>
        <div className="flex items-center justify-center gap-3">
          <div className="relative w-10 h-10">
            <img
              src="/assets/icon.png"
              alt="Flow Browser Logo"
              width={40}
              height={40}
              className="object-contain rounded-full"
            />
          </div>
          <h1 className="text-4xl font-bold m-0 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-300">
            Flow Browser
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mt-2">Your gateway to the web</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="w-full max-w-xl mb-8 md:mb-12"
      >
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search or enter website name"
            className="w-full py-3 px-6 pr-16 text-lg rounded-md bg-white border-none text-gray-800 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder-gray-400 shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-blue-400 transition-all duration-200"
            autoFocus
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 py-2 px-4 bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-400 dark:to-purple-400 text-white rounded-md font-semibold cursor-pointer transition-transform duration-200 hover:shadow-md flex items-center gap-1"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Search</span>
          </button>
        </form>
      </motion.div>

      <div className="w-full max-w-3xl mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Quick Links</h2>
        <div className="flex gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Plus className="w-4 h-4" />
                <span>Add Link</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
              <DialogHeader>
                <DialogTitle className="text-gray-900 dark:text-gray-100">Add New Quick Link</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right text-gray-700 dark:text-gray-300">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={newLinkName}
                    onChange={(e) => setNewLinkName(e.target.value)}
                    className="col-span-3 text-gray-900 dark:text-gray-100"
                    placeholder="Google"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="url" className="text-right text-gray-700 dark:text-gray-300">
                    URL
                  </Label>
                  <Input
                    id="url"
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    className="col-span-3 text-gray-900 dark:text-gray-100"
                    placeholder="https://google.com"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  className="text-gray-700 dark:text-gray-300"
                >
                  Cancel
                </Button>
                <Button onClick={handleAddLink} disabled={!newLinkName || !newLinkUrl}>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm" onClick={handleResetToDefaults} className="flex items-center gap-1">
            <Trash2 className="w-4 h-4" />
            <span>Reset</span>
          </Button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full max-w-3xl"
      >
        <ScrollArea className="h-[240px] w-full rounded-md border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-4">
            {quickLinks.map((link, index) => (
              <motion.div
                key={link.id}
                className="relative group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <button
                  onClick={() => handleDeleteLink(link.id)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  aria-label={`Delete ${link.name}`}
                >
                  <X className="w-3 h-3" />
                </button>
                <a
                  href={link.url}
                  className="flex flex-col items-center justify-center bg-white text-gray-800 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 rounded-lg p-3 no-underline shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 h-full"
                >
                  <div className="mb-2 flex items-center justify-center w-10 h-10 overflow-hidden">
                    <WebsiteFavicon url={link.url} favicon={link.favicon} className="w-8 h-8" />
                  </div>
                  <div className="font-medium text-base">{link.name}</div>
                </a>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400"
      >
        <p>
          Press <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">Tab</kbd> to focus on search
        </p>
      </motion.div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider persist>
      <title>New Tab</title>
      <Page />
    </ThemeProvider>
  );
}

export default App;
