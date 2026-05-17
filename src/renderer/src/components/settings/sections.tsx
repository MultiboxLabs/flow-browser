import { GeneralSection } from "@/components/settings/new-sections/general";
import { IconSection } from "@/components/settings/new-sections/icon/section";

import { BlocksIcon, UsersIcon, KeyboardIcon, Info, LucideIcon, DockIcon, OrbitIcon, CogIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Section {
  id: string;
  label: string;
  icon: LucideIcon;
  borderCN?: string;
  backgroundCN?: string;
  iconCN?: string;
  section?: React.ReactNode;
}

export const sections: Section[] = [
  {
    id: "general",
    label: "General",
    icon: CogIcon,
    backgroundCN: cn("bg-linear-to-b from-gray-300 to-gray-400"),
    borderCN: cn("border border-gray-400/80"),
    iconCN: cn("text-black"),
    section: <GeneralSection />
  },
  {
    id: "icons",
    label: "Icon",
    icon: DockIcon,
    backgroundCN: cn("bg-linear-to-b from-orange-400 to-orange-500"),
    borderCN: cn("border border-orange-600/60"),
    iconCN: cn("text-white"),
    section: <IconSection />
  },
  {
    id: "profiles",
    label: "Profiles",
    icon: UsersIcon,
    backgroundCN: cn("bg-linear-to-b from-blue-400 to-blue-600"),
    borderCN: cn("border border-blue-700/60"),
    iconCN: cn("text-white")
  },
  {
    id: "spaces",
    label: "Spaces",
    icon: OrbitIcon,
    backgroundCN: cn("bg-linear-to-b from-violet-400 to-purple-600"),
    borderCN: cn("border border-purple-700/60"),
    iconCN: cn("text-white")
  },
  {
    id: "external-apps",
    label: "External Apps",
    icon: BlocksIcon,
    backgroundCN: cn("bg-linear-to-b from-emerald-400 to-green-600"),
    borderCN: cn("border border-green-700/60"),
    iconCN: cn("text-white")
  },
  {
    id: "shortcuts",
    label: "Shortcuts",
    icon: KeyboardIcon,
    backgroundCN: cn("bg-linear-to-b from-pink-400 to-rose-500"),
    borderCN: cn("border border-rose-600/60"),
    iconCN: cn("text-white")
  },
  {
    id: "about",
    label: "About",
    icon: Info,
    backgroundCN: cn("bg-linear-to-b from-sky-400 to-cyan-500"),
    borderCN: cn("border border-cyan-600/60"),
    iconCN: cn("text-white")
  }
];
