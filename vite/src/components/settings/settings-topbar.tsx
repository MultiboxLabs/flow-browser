"use client";

import { DockIcon, Globe, Info } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "motion/react";

interface SettingsTopbarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

export function SettingsTopbar({ activeSection, setActiveSection }: SettingsTopbarProps) {
  const sections = [
    { id: "general", label: "General", icon: <Globe className="h-4 w-4 mr-2" /> },
    { id: "icons", label: "Icon", icon: <DockIcon className="h-4 w-4 mr-2" /> },
    { id: "about", label: "About", icon: <Info className="h-4 w-4 mr-2" /> }
  ];

  return (
    <>
      <div className="w-full border-b bg-background px-4 app-drag">
        <div className="flex items-center justify-center h-10">
          <span className="font-bold">Flow Settings</span>
        </div>
      </div>
      <div className="w-full border-b bg-background px-4 h-10">
        <motion.div className="w-full h-full flex items-center justify-center" layout>
          <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
            <TabsList className="bg-transparent h-10 p-0 w-full gap-0 justify-between">
              {sections.map((section) => (
                <TabsTrigger
                  key={section.id}
                  value={section.id}
                  className="flex items-center h-10 flex-1 rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none"
                >
                  {section.icon}
                  <span>{section.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </motion.div>
      </div>
    </>
  );
}
