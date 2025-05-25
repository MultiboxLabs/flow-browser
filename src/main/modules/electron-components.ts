export async function waitForElectronComponentsToBeReady() {
  const electron = await import("electron");

  if ("components" in electron) {
    const { components } = electron;

    // @ts-ignore: This is defined in Widevine Electron, but not in the stock Electron
    return components
      .whenReady()
      .then(() => true)
      .catch(() => false);
  }

  return Promise.resolve(false);
}
