"use client";

import { BlocksIcon, DockIcon, Globe, Info, OrbitIcon, UsersIcon } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";

interface SettingsTopbarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

export function SettingsTopbar({ activeSection, setActiveSection }: SettingsTopbarProps) {
  const { t } = useTranslation("settings");

  const sections = [
    { id: "general", label: t("General"), icon: <Globe className="h-4 w-4 mr-2" /> },
    { id: "icons", label: t("Icon"), icon: <DockIcon className="h-4 w-4 mr-2" /> },
    { id: "profiles", label: t("Profiles"), icon: <UsersIcon className="h-4 w-4 mr-2" /> },
    { id: "spaces", label: t("Spaces"), icon: <OrbitIcon className="h-4 w-4 mr-2" /> },
    { id: "external-apps", label: t("External Apps"), icon: <BlocksIcon className="h-4 w-4 mr-2" /> },
    { id: "about", label: t("About"), icon: <Info className="h-4 w-4 mr-2" /> }
  ];

  return (
    <>
      <div className="w-full border-b bg-background px-4 app-drag">
        <div className="flex items-center justify-center h-10">
          <span className="font-bold">{t("Flow Settings")}</span>
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
