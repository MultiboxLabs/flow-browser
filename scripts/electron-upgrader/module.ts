const NEXT_MAJOR_VERSION = 37;
const CURRENT_MAJOR_VERSION = 36;

const ELECTRON_REPOSITORY = "castlabs/electron-releases";
const TAG_PREFIX = "v";
const TAG_SUFFIX = "+wvcus";

interface GitHubRelease {
  tag_name: string;
  name: string;
  published_at: string;
  prerelease: boolean;
}

/**
 * Fetches releases from the GitHub repository
 */
async function fetchReleases(): Promise<GitHubRelease[]> {
  const response = await fetch(`https://api.github.com/repos/${ELECTRON_REPOSITORY}/releases`);
  if (!response.ok) {
    throw new Error(`Failed to fetch releases: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Extracts major version from a tag name
 */
function extractMajorVersion(tagName: string): number | null {
  const match = tagName.match(new RegExp(`^${TAG_PREFIX}(\\d+)\\.`));
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Finds the latest version for the current major version
 * Prerelease versions are ignored
 */
export async function findLatestCurrentMajorVersion(): Promise<string | null> {
  try {
    const releases = await fetchReleases();

    const currentMajorReleases = releases
      .filter((release) => {
        const majorVersion = extractMajorVersion(release.tag_name);
        return majorVersion === CURRENT_MAJOR_VERSION && release.tag_name.includes(TAG_SUFFIX) && !release.prerelease;
      })
      .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());

    return currentMajorReleases.length > 0 ? currentMajorReleases[0].tag_name : null;
  } catch (error) {
    console.error("Error fetching latest current major version:", error);
    return null;
  }
}

/**
 * Finds the latest version for the next major version
 * Prerelease versions are included
 */
export async function findLatestNextMajorVersion(): Promise<string | null> {
  try {
    const releases = await fetchReleases();

    const nextMajorReleases = releases
      .filter((release) => {
        const majorVersion = extractMajorVersion(release.tag_name);
        return majorVersion === NEXT_MAJOR_VERSION && release.tag_name.includes(TAG_SUFFIX);
      })
      .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());

    return nextMajorReleases.length > 0 ? nextMajorReleases[0].tag_name : null;
  } catch (error) {
    console.error("Error fetching latest next major version:", error);
    return null;
  }
}
