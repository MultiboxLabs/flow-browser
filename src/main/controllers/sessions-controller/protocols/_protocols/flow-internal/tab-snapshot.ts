import { randomUUID } from "crypto";
import { bufferToArrayBuffer } from "@/modules/utils";
import { HonoApp } from ".";

// In-memory store of JPEG buffers keyed by UUID.
// Snapshots are stored when a tab's view is moved away from a window,
// and cleaned up when the placeholder is cleared.
const snapshotStore = new Map<string, Buffer>();

// JPEG quality for placeholder screenshots. Encoding is dramatically faster
// and more consistent than PNG (which varies 26ms–900ms+ depending on image
// complexity). At 50% opacity the quality difference is imperceptible.
const SNAPSHOT_JPEG_QUALITY = 70;

// Maximum pixel width for stored snapshots. Images wider than this are
// downscaled proportionally before JPEG encoding. This saves encode time,
// transfer size, and renderer decode time on high-DPI / 4K displays while
// keeping 1080p captures untouched (1920 ≤ 1920 → no resize).
const SNAPSHOT_MAX_WIDTH = 1920;

/**
 * Stores a NativeImage snapshot and returns a UUID that can be used
 * to retrieve it via the `flow-internal://tab-snapshot?id={uuid}` URL.
 *
 * Images larger than SNAPSHOT_MAX_WIDTH are downscaled proportionally
 * so that high-DPI captures (e.g. 3840x2160 on 4K) don't pay a
 * disproportionate encode/decode cost. At 50% opacity with CSS
 * object-fill stretching, the quality difference is imperceptible.
 * Screens at or below 1080p are left at native resolution.
 */
export function storeSnapshot(image: Electron.NativeImage): string {
  const id = randomUUID();
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
  return id;
}

/**
 * Removes a previously stored snapshot, freeing memory.
 */
export function removeSnapshot(id: string): void {
  snapshotStore.delete(id);
}

/**
 * Registers the `/tab-snapshot` route on the flow-internal Hono app.
 * Serves stored JPEG snapshots by UUID.
 */
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
