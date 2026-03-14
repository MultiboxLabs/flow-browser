import { bufferToArrayBuffer, generateID } from "@/modules/utils";
import { HonoApp } from ".";

// In-memory JPEG snapshots keyed by UUID.
const snapshotStore = new Map<string, Buffer>();
const snapshotTimestamps = new Map<string, number>();

// Evict snapshots older than 30s (safety net if removeSnapshot is never called).
const SNAPSHOT_TTL_MS = 30_000;
setInterval(() => {
  const now = Date.now();
  for (const [id, ts] of snapshotTimestamps.entries()) {
    if (now - ts > SNAPSHOT_TTL_MS) {
      snapshotStore.delete(id);
      snapshotTimestamps.delete(id);
    }
  }
}, 5_000);

// JPEG quality — encoding is much faster and more consistent than PNG.
const SNAPSHOT_JPEG_QUALITY = 70;

// Max pixel width; wider images are downscaled proportionally before encoding.
const SNAPSHOT_MAX_WIDTH = 1920;

/**
 * Stores a NativeImage snapshot (downscaling if wider than SNAPSHOT_MAX_WIDTH)
 * and returns a UUID for retrieval via `flow-internal://tab-snapshot?id={uuid}`.
 */
export function storeSnapshot(image: Electron.NativeImage): string {
  const id = generateID();
  const size = image.getSize();

  let toEncode = image;
  if (size.width > SNAPSHOT_MAX_WIDTH) {
    const scale = SNAPSHOT_MAX_WIDTH / size.width;
    toEncode = image.resize({
      width: SNAPSHOT_MAX_WIDTH,
      height: Math.round(size.height * scale)
    });
  }

  const jpegBuffer = toEncode.toJPEG(SNAPSHOT_JPEG_QUALITY);
  snapshotStore.set(id, jpegBuffer);
  snapshotTimestamps.set(id, Date.now());
  return id;
}

export function removeSnapshot(id: string): void {
  snapshotStore.delete(id);
  snapshotTimestamps.delete(id);
}

export function registerTabSnapshotRoutes(app: HonoApp) {
  app.get("/tab-snapshot", (c) => {
    const id = c.req.query("id");
    if (!id) {
      return c.text("No snapshot ID provided", 400);
    }

    const jpegBuffer = snapshotStore.get(id);
    if (!jpegBuffer) {
      return c.text("Snapshot not found", 404);
    }

    const arrayBuffer = bufferToArrayBuffer(jpegBuffer);
    return c.body(arrayBuffer, 200, {
      "Content-Type": "image/jpeg",
      "Cache-Control": "no-store"
    });
  });
}
