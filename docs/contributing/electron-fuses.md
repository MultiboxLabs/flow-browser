# Electron Fuses

Electron Fuses are a way to modify the behavior of the Electron app. They are used to enable or disable certain features of the app.

## Current Fuses (Production)

runAsNode: false
enableCookieEncryption: true
enableNodeOptionsEnvironmentVariable: false
enableNodeCliInspectArguments: false
enableEmbeddedAsarIntegrityValidation: true
onlyLoadAppFromAsar: true
loadBrowserProcessSpecificV8Snapshot: false
grantFileProtocolExtraPrivileges: true

## Dev Fuses

Uses the default fuses. The data between `Flow (Dev)` and `Flow` is not compatable as cookies won't be encrypted in the Dev version.

Running `Flow (Dev)` with decrypted cookies will cause cookies store to be corrupted.
