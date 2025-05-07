"use client";

import { motion } from "motion/react";
import { LucideIcon } from "lucide-react";

interface Section {
  id: string;
  label: string;
  icon: React.ReactElement<LucideIcon>;
}

interface SettingsSidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  sections: Section[];
}

export function SettingsSidebar({ activeSection, setActiveSection, sections }: SettingsSidebarProps) {
  return (
    <div className="w-48 border-r bg-muted/30 p-4 px-3 flex flex-col gap-2">
      <nav className="flex flex-col gap-1">
        {sections.map((section) => (
          <motion.button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`w-full flex items-center justify-start px-3 py-2 rounded-md text-sm font-medium transition-colors
                        ${activeSection === section.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            layout
          >
            {section.icon}
            <span>{section.label}</span>
          </motion.button>
        ))}
      </nav>
    </div>
  );
}
