# Electron Dependency

We use [Castlabs's Electron for Content Security](https://github.com/castlabs/electron-releases), which is a fork of Electron with support for Widevine Content Decryption Module (CDM).

## Updating Electron Manually

1. Find the latest version of Electron in the [Castlabs Electron Releases](https://github.com/castlabs/electron-releases/releases) page.
2. Update the `electron` version in the `package.json` file in this format:

```json
// Template
"electron": "https://github.com/castlabs/electron-releases#<version>",

// Example
"electron": "https://github.com/castlabs/electron-releases#v35.3.0+wvcus",
```

3. Run `bun install` to update `bun.lock` file.

4. Find the electron entry in the `bun.lock` file and update it:

```json
// Template
"electron": ["electron@github:castlabs/electron-releases#<short_commit_hash>", "...", "castlabs-electron-releases-<short_commit_hash>"],

// Example
"electron": ["electron@github:castlabs/electron-releases#4fab3f1", "...", "castlabs-electron-releases-4fab3f1"],
```

5. Run `bun install` again to make sure the `bun.lock` file isn't overwritten.

6. You're all set!

7. Additionally, you can delete bun's cache at `~/.bun/install/cache`, delete `node_modules`, and re-run `bun install` to make sure everything would work as expected.

## Why do we have to do all that?

This is because of a [bun issue](https://github.com/oven-sh/bun/issues/19585), which causes `git clone` of the fork to fail.

## Additional Notes

- Make sure `electron` is in the devDependencies, not the dependencies!
