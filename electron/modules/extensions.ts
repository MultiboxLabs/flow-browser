import { getSessionWithoutCreating } from "@/browser/sessions";
import { session } from "electron";
import { setPartitionSessionGrabber } from "electron-chrome-extensions";

const partitionSessionGrabber = (partition: string) => {
  // custom: grab the session from the profile
  const PROFILE_PREFIX = "profile:";
  if (partition.startsWith(PROFILE_PREFIX)) {
    const profileId = partition.slice(PROFILE_PREFIX.length);
    const session = getSessionWithoutCreating(profileId);
    if (session) {
      return session;
    } else {
      throw new Error(`Session not found for profile ${profileId}`);
    }
  }

  return session.fromPartition(partition);
};

setPartitionSessionGrabber(partitionSessionGrabber);
