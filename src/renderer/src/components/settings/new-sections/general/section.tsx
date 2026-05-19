import { AppUpdatesProvider } from "@/components/providers/app-updates-provider";
import { UpdateContainer } from "./update-container";

export function GeneralSection() {
  return (
    <AppUpdatesProvider>
      <UpdateContainer />
      {new Array(100).fill(0).map((_, index) => (
        <div key={index} className="h-10 w-10 bg-green-500">
          {index}
        </div>
      ))}
    </AppUpdatesProvider>
  );
}
