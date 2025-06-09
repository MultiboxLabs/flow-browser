const BETA_MAJOR_VERSION = 37;
const STABLE_MAJOR_VERSION = 36;

const ELECTRON_REPOSITORY = "castlabs/electron-releases";
const TAG_PREFIX = "v";
const TAG_SUFFIX = "+wvcus";

interface GitHubRelease {
  tag_name: string;
  name: string;
  published_at: string;
  prerelease: boolean;
}

interface GitHubTagRef {
  ref: string;
  node_id: string;
  url: string;
  object: {
    sha: string;
    type: string;
    url: string;
  };
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
 * Finds the latest version for the stable major version
 * Prerelease versions are ignored
 */
export async function findLatestStableMajorVersion(): Promise<string | null> {
  try {
    const releases = await fetchReleases();

    const stableMajorReleases = releases
      .filter((release) => {
        const majorVersion = extractMajorVersion(release.tag_name);
        return majorVersion === STABLE_MAJOR_VERSION && release.tag_name.includes(TAG_SUFFIX) && !release.prerelease;
      })
      .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());

    return stableMajorReleases.length > 0 ? stableMajorReleases[0].tag_name : null;
  } catch (error) {
    console.error("Error fetching latest stable major version:", error);
    return null;
  }
}

/**
 * Finds the latest version for the beta major version
 * Prerelease versions are included
 */
export async function findLatestBetaMajorVersion(): Promise<string | null> {
  try {
    const releases = await fetchReleases();

    const betaMajorReleases = releases
      .filter((release) => {
        const majorVersion = extractMajorVersion(release.tag_name);
        return majorVersion === BETA_MAJOR_VERSION && release.tag_name.includes(TAG_SUFFIX);
      })
      .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());

    return betaMajorReleases.length > 0 ? betaMajorReleases[0].tag_name : null;
  } catch (error) {
    console.error("Error fetching latest beta major version:", error);
    return null;
  }
}

/**
 * Gets the commit hash for a given tag name
 */
export async function getCommitHashForTag(tagName: string): Promise<string | null> {
  try {
    // Remove the TAG_PREFIX if it exists in the tagName for the API call
    const cleanTagName = tagName.startsWith(TAG_PREFIX) ? tagName : `${TAG_PREFIX}${tagName}`;

    const response = await fetch(`https://api.github.com/repos/${ELECTRON_REPOSITORY}/git/refs/tags/${cleanTagName}`);
    if (!response.ok) {
      if (response.status === 404) {
        console.error(`Tag ${cleanTagName} not found`);
        return null;
      }
      throw new Error(`Failed to fetch tag reference: ${response.statusText}`);
    }

    const tagRef: GitHubTagRef = await response.json();
    return tagRef.object.sha;
  } catch (error) {
    console.error(`Error fetching commit hash for tag ${tagName}:`, error);
    return null;
  }
}
