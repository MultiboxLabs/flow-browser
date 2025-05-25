import { Space } from "~/flow/interfaces/sessions/spaces";
import { SpaceIconPicker } from "../icon-picker";
import { motion } from "motion/react";

type SpaceIconEditorProps = {
  editedSpace: Space;
  updateEditedSpace: (updates: Partial<Space>) => void;
};

export function SpaceIconEditor({ editedSpace, updateEditedSpace }: SpaceIconEditorProps) {
  return (
    <motion.div
      className="space-y-5 pt-2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.6 }}
    >
      <h3 className="text-lg font-medium flex items-center gap-2">Space Icon</h3>
      <SpaceIconPicker
        selectedIcon={editedSpace.icon || "Globe"}
        onSelectIcon={(iconId) => updateEditedSpace({ icon: iconId })}
      />
    </motion.div>
  );
}
