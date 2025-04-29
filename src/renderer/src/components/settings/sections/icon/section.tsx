import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "motion/react";
import { toast } from "sonner";

interface IconOption {
  id: string;
  name: string;
  author?: string;
  imageId?: string;
  current?: boolean;
}

export function IconSettings() {
  const [selectedIcon, setSelectedIcon] = useState<string>("");
  const [iconOptions, setIconOptions] = useState<IconOption[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Check if platform supports icon customization
        const supported = await flow.icons.isPlatformSupported();
        setIsSupported(supported);

        if (!supported) {
          setIsLoading(false);
          return;
        }

        // Fetch both icons and current icon in parallel
        const [icons, currentIconId] = await Promise.all([flow.icons.getIcons(), flow.icons.getCurrentIcon()]);

        setSelectedIcon(currentIconId);

        // Transform IconData to IconOption format
        const options: IconOption[] = icons.map((icon) => ({
          id: icon.id,
          name: icon.name,
          author: icon.author,
          imageId: icon.image_id,
          current: icon.id === currentIconId
        }));

        setIconOptions(options);
      } catch (error) {
        console.error("Failed to fetch icons:", error);
        // Fallback to hardcoded options if API fails
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle icon selection
  const handleIconSelect = async (iconId: string) => {
    if (iconId === selectedIcon || isUpdating) return;

    setIsUpdating(true);
    try {
      const success = await flow.icons.setCurrentIcon(iconId);
      if (success) {
        toast.success("Icon updated!");
        setSelectedIcon(iconId);

        // Update current status for icons
        setIconOptions((prev) =>
          prev.map((icon) => ({
            ...icon,
            current: icon.id === iconId
          }))
        );
      }
    } catch (error) {
      console.error("Failed to update icon:", error);
      toast.error("Failed to update icon!");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <Card className="flex-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Browser Icon</CardTitle>
          <CardDescription className="text-sm">Select an icon for your browser application</CardDescription>
        </CardHeader>
        <CardContent>
          {!isSupported ? (
            <div className="flex items-center justify-center h-40">
              <div className="text-muted-foreground">Icon customization is not supported on this platform.</div>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-pulse text-muted-foreground">Loading icons...</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {iconOptions.map((icon) => (
                <motion.div
                  key={icon.id}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className={`flex items-center border rounded-md p-3 cursor-pointer ${
                    selectedIcon === icon.id
                      ? "border-primary ring-1 ring-primary"
                      : "border-border hover:border-primary/50"
                  } relative overflow-hidden ${isUpdating ? "opacity-70 pointer-events-none" : ""}`}
                  onClick={() => handleIconSelect(icon.id)}
                >
                  <div className="h-12 w-12 relative mr-3 flex-shrink-0">
                    <div className="absolute inset-0 flex items-center justify-center">
                      {icon.imageId ? (
                        <img
                          src={`flow://asset/icons/${icon.imageId}`}
                          alt={icon.name}
                          className="h-10 w-10 rounded-lg shadow-lg flex items-center justify-center text-xl font-bold text-white"
                        />
                      ) : (
                        "F"
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col justify-center">
                      <h3 className="font-medium text-base truncate">{icon.name}</h3>
                      {icon.author && <p className="text-xs text-muted-foreground truncate">by {icon.author}</p>}
                    </div>
                  </div>

                  {selectedIcon === icon.id && !isUpdating && (
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute top-1 right-1 h-5 w-5 bg-primary rounded-full flex items-center justify-center shadow-md"
                    >
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </motion.div>
                  )}

                  {selectedIcon === icon.id && isUpdating && (
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute top-1 right-1 h-5 w-5 bg-primary rounded-full flex items-center justify-center shadow-md"
                    >
                      <Loader2 className="h-3 w-3 text-primary-foreground animate-spin" />
                    </motion.div>
                  )}

                  {icon.current && selectedIcon !== icon.id && !isUpdating && (
                    <div className="absolute top-1 right-1">
                      <span className="text-[10px] text-blue-500 font-medium bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded-full">
                        CURRENT
                      </span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
