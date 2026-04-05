import { sessionsController } from "@/controllers/sessions-controller";
import { app, session } from "electron";
import { ElectronChromeExtensions, setSessionPartitionResolver } from "electron-chrome-extensions";

// A hack to load profiles rather than partitions
const partitionSessionGrabber = (partition: string) => {
  // custom: grab the session from the profile
  const PROFILE_PREFIX = "profile:";
  if (partition.startsWith(PROFILE_PREFIX)) {
    const profileId = partition.slice(PROFILE_PREFIX.length);
    const session = sessionsController.getIfExists(profileId);
    if (!session) {
      throw new Error(`Session not found for profile ${profileId}`);
    }

    return session;
  }

  return session.fromPartition(partition);
};

setSessionPartitionResolver(partitionSessionGrabber);

// Register CRX protocol in default session
app.whenReady().then(() => {
  ElectronChromeExtensions.handleCRXProtocol(session.defaultSession);
});
