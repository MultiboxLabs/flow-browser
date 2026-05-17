import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const DEFAULT_ICON_ID = "default";

export interface IconOption {
  id: string;
  name: string;
  author?: string;
  imageId?: string;
  current: boolean;
}

interface IconContextValue {
  icons: IconOption[];
  selectedIconId: string;
  isLoading: boolean;
  isSupported: boolean;
  isUpdating: boolean;
  selectIcon: (iconId: string) => Promise<void>;
}

const IconContext = createContext<IconContextValue | null>(null);

function toIconOptions(icons: Awaited<ReturnType<typeof flow.icons.getIcons>>, currentIconId: string): IconOption[] {
  return icons.map((icon) => ({
    id: icon.id,
    name: icon.name,
    author: icon.author,
    imageId: icon.image_id,
    current: icon.id === currentIconId
  }));
}

export function IconProvider({ children }: { children: ReactNode }) {
  const [icons, setIcons] = useState<IconOption[]>([]);
  const [selectedIconId, setSelectedIconId] = useState<string>(DEFAULT_ICON_ID);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupported, setIsSupported] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const fetchData = async () => {
      setIsLoading(true);

      try {
        const supported = await flow.icons.isPlatformSupported();

        if (isCancelled) {
          return;
        }

        setIsSupported(supported);

        if (!supported) {
          setIcons([]);
          return;
        }

        const [availableIcons, currentIconId] = await Promise.all([flow.icons.getIcons(), flow.icons.getCurrentIcon()]);

        if (isCancelled) {
          return;
        }

        setSelectedIconId(currentIconId);
        setIcons(toIconOptions(availableIcons, currentIconId));
      } catch (error) {
        console.error("Failed to fetch icons:", error);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void fetchData();

    return () => {
      isCancelled = true;
    };
  }, []);

  const selectIcon = useCallback(
    async (iconId: string) => {
      if (iconId === selectedIconId || isUpdating || !isSupported) {
        return;
      }

      setIsUpdating(true);

      try {
        const success = await flow.icons.setCurrentIcon(iconId);

        if (!success) {
          toast.error("Failed to update icon!");
          return;
        }

        toast.success("Icon updated!");
        setSelectedIconId(iconId);
        setIcons((previousIcons) =>
          previousIcons.map((icon) => ({
            ...icon,
            current: icon.id === iconId
          }))
        );
      } catch (error) {
        console.error("Failed to update icon:", error);
        toast.error("Failed to update icon!");
      } finally {
        setIsUpdating(false);
      }
    },
    [isSupported, isUpdating, selectedIconId]
  );

  const value = useMemo<IconContextValue>(
    () => ({
      icons,
      selectedIconId,
      isLoading,
      isSupported,
      isUpdating,
      selectIcon
    }),
    [icons, selectedIconId, isLoading, isSupported, isUpdating, selectIcon]
  );

  return <IconContext.Provider value={value}>{children}</IconContext.Provider>;
}

export function useIconContext() {
  const context = useContext(IconContext);
  if (!context) {
    throw new Error("useIconContext must be used within a IconProvider");
  }
  return context;
}
