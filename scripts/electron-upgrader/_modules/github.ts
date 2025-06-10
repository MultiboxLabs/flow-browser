/** The major version number for next major version electron releases */
const NEXT_MAJOR_VERSION = 37;

/** The major version number for current major version electron releases */
const CURRENT_MAJOR_VERSION = 36;

/** The GitHub repository containing electron releases */
const ELECTRON_REPOSITORY = "castlabs/electron-releases";

/** The prefix used in electron version tags */
const TAG_PREFIX = "v";

/** The suffix used in castlabs electron version tags */
const TAG_SUFFIX = "+wvcus";

/**
 * Represents a GitHub release object from the GitHub API
 */
interface GitHubRelease {
  /** The tag name of the release (e.g., "v36.4.0+wvcus") */
  tag_name: string;
  /** The display name of the release */
  name: string;
  /** ISO timestamp when the release was published */
  published_at: string;
  /** Whether this is a prerelease version */
  prerelease: boolean;
}

/**
 * Represents a GitHub tag reference object from the GitHub API
 */
interface GitHubTagRef {
  /** The git reference path (e.g., "refs/tags/v36.4.0+wvcus") */
  ref: string;
  /** Unique node identifier for the reference */
  node_id: string;
  /** API URL for this reference */
  url: string;
  /** The git object this reference points to */
  object: {
    /** The SHA hash of the commit this tag points to */
    sha: string;
    /** The type of git object (usually "commit") */
    type: string;
    /** API URL for the git object */
    url: string;
  };
}

function getGitHubHeaders(): HeadersInit {
  if (process.env.GITHUB_TOKEN) {
    return {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`
    };
  }

  return {};
}

/**
 * Fetches all releases from the castlabs/electron-releases GitHub repository
 *
 * @returns {Promise<GitHubRelease[]>} A promise that resolves to an array of GitHub releases
 * @throws {Error} Throws an error if the GitHub API request fails
 * @example
 * const releases = await fetchReleases();
 * console.log(`Found ${releases.length} releases`);
 */
async function fetchReleases(): Promise<GitHubRelease[]> {
  const response = await fetch(`https://api.github.com/repos/${ELECTRON_REPOSITORY}/releases`, {
    headers: getGitHubHeaders()
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch releases: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Extracts the major version number from an electron tag name
 *
 * @param {string} tagName - The tag name to parse (e.g., "v36.4.0+wvcus")
 * @returns {number | null} The major version number, or null if parsing fails
 * @example
 * extractMajorVersion("v36.4.0+wvcus"); // Returns 36
 * extractMajorVersion("invalid-tag"); // Returns null
 */
function extractMajorVersion(tagName: string): number | null {
  const match = tagName.match(new RegExp(`^${TAG_PREFIX}(\\d+)\\.`));
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Finds the latest version with a specific major version number
 *
 * @param {number} targetMajorVersion - The major version number to search for
 * @param {boolean} includePrereleases - Whether to include prereleases in the search
 * @returns {Promise<string | null>} A promise that resolves to the latest version with the specified major version, or null if not found
 * @example
 * const latestVersion = await findLatestVersionWithMajorVersion(36);
 * console.log(`Latest version with major version 36: ${latestVersion}`); // "v36.4.0+wvcus"
 */
export async function findLatestVersionWithMajorVersion(
  targetMajorVersion: number,
  includePrereleases: boolean = false
): Promise<string | null> {
  try {
    const releases = await fetchReleases();

    const currentMajorReleases = releases
      .filter((release) => {
        if (!includePrereleases && release.prerelease) return false;

        const majorVersion = extractMajorVersion(release.tag_name);
        return majorVersion === targetMajorVersion && release.tag_name.includes(TAG_SUFFIX);
      })
      .sort((a, b) => {
        // Sort prereleases to the end
        if (a.prerelease && !b.prerelease) return 1;
        if (!a.prerelease && b.prerelease) return -1;

        // Sort by published date
        return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
      });

    return currentMajorReleases.length > 0 ? currentMajorReleases[0].tag_name : null;
  } catch (error) {
    console.error(`Error fetching latest version with major version ${targetMajorVersion}:`, error);
    return null;
  }
}

export async function findLatestCurrentMajorVersion(): Promise<string | null> {
  return findLatestVersionWithMajorVersion(CURRENT_MAJOR_VERSION, false);
}

export async function findLatestNextMajorVersion(): Promise<string | null> {
  return findLatestVersionWithMajorVersion(NEXT_MAJOR_VERSION, true);
}

/**
 * Retrieves the git commit hash for a specific electron version tag
 *
 * @param {string} tagName - The tag name to get the commit hash for (with or without "v" prefix)
 * @returns {Promise<string | null>} A promise that resolves to the commit SHA hash, or null if not found
 * @throws {Error} May throw if GitHub API requests fail (except for 404 errors)
 * @example
 * const hash = await getCommitHashForTag("v36.4.0+wvcus");
 * console.log(`Commit hash: ${hash}`); // "cc2b16d4c0e43cfd4e20da691a017606cc226f5f"
 */
export async function getCommitHashForTag(tagName: string): Promise<string | null> {
  try {
    // Remove the TAG_PREFIX if it exists in the tagName for the API call
    const cleanTagName = tagName.startsWith(TAG_PREFIX) ? tagName : `${TAG_PREFIX}${tagName}`;

    const response = await fetch(`https://api.github.com/repos/${ELECTRON_REPOSITORY}/git/refs/tags/${cleanTagName}`, {
      headers: getGitHubHeaders()
    });
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
