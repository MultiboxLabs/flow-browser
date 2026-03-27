/// Imports ///
import fs from "fs/promises";

/// Constants ///
const SOURCE_URL = "https://raw.githubusercontent.com/T3-Content/unduck/refs/heads/main/src/bang.ts";
const TARGET_PATH = "src/renderer/src/lib/omnibox-new/bangs.ts";

/// Main ///
async function main() {
  const res = await fetch(SOURCE_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch bang source: ${res.status} ${res.statusText}`);
  }

  const source = await res.text();
  await fs.writeFile(TARGET_PATH, source, "utf8");
  console.log(`Wrote bangs to ${TARGET_PATH}`);
}

await main();
