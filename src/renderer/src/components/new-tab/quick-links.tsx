import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Plus, X, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WebsiteFavicon } from "@/components/main/website-favicon";

// Interface for quick links
export interface QuickLink {
  id: string;
  name: string;
  url: string;
  favicon?: string;
  extraClass?: string;
}

// Default quick links
export const defaultQuickLinks: QuickLink[] = [
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
    id: "gmail",
    name: "Gmail",
    url: "https://mail.google.com",
    favicon: "https://www.google.com/gmail/about/static/images/logo-gmail.png"
  },
  {
    id: "netflix",
    name: "Netflix",
    url: "https://netflix.com",
    favicon: "https://www.netflix.com/favicon.ico"
  }
];

interface QuickLinksProps {
  className?: string;
}

export function QuickLinks({ className = "" }: QuickLinksProps) {
  const [quickLinks, setQuickLinks] = useState<QuickLink[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newLinkName, setNewLinkName] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [mounted, setMounted] = useState(false);

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
  }, []);

  // Save quicklinks to localStorage when they change
  useEffect(() => {
    if (mounted && quickLinks.length > 0) {
      localStorage.setItem("quickLinks", JSON.stringify(quickLinks));
    }
  }, [quickLinks, mounted]);

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={`w-full max-w-2xl mt-auto ${className}`}
    >
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-sm font-medium text-gray-600 dark:text-gray-300">Quick Links</h2>
        <div className="flex gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1 text-xs py-1 h-7">
                <Plus className="w-3 h-3" />
                <span className="hidden">Add</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-[90vw] max-w-md">
              <DialogHeader>
                <DialogTitle className="text-gray-900 dark:text-gray-100">Add New Quick Link</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-2 sm:gap-4">
                  <Label htmlFor="name" className="text-right text-gray-700 dark:text-gray-300 text-sm sm:text-base">
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
                <div className="grid grid-cols-4 items-center gap-2 sm:gap-4">
                  <Label htmlFor="url" className="text-right text-gray-700 dark:text-gray-300 text-sm sm:text-base">
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
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetToDefaults}
            className="flex items-center gap-1 text-xs py-1 h-7"
          >
            <Trash2 className="w-3 h-3" />
            <span className="hidden">Reset</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-4 p-2">
        {quickLinks.map((link, index) => (
          <motion.div
            key={link.id}
            className="relative group"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
          >
            <button
              onClick={() => handleDeleteLink(link.id)}
              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-elevated"
              aria-label={`Delete ${link.name}`}
            >
              <X className="w-2 h-2" />
            </button>
            <a
              href={link.url}
              className="flex flex-col items-center justify-center w-20 bg-white/80 text-gray-800 dark:bg-gray-800/80 dark:text-gray-200 dark:hover:bg-gray-700/90 rounded-lg p-2 no-underline shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200"
            >
              <div className="mb-1 flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 overflow-hidden">
                <WebsiteFavicon url={link.url} favicon={link.favicon} className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="font-medium text-xs truncate w-full text-center">{link.name}</div>
            </a>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
