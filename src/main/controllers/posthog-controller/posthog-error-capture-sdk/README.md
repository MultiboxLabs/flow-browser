# PostHog Error Capture

This is taken from a directory in [PostHog/posthog-js-lite](https://github.com/PostHog/posthog-js-lite/tree/6f67f8a3e9724479011173f7b0fc0c190806da2b/posthog-node/src/extensions/error-tracking) and forked.

## Modifications

- Added a fallback distinct ID to use when no distinct ID is provided.
- Use fallback distinct ID for autocapture.
