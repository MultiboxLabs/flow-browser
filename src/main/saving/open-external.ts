import { getDatastore } from "@/saving/datastore";

const AlwaysOpenExternalDataStore = getDatastore("always-open-external");

function getKey(requestingURL: string, openingURLString: string) {
  const url = new URL(requestingURL);
  const minifiedUrl = `${url.protocol}//${url.host}`;

  const openingURL = new URL(openingURLString);
  const openingProtocol = openingURL.protocol;

  const b64URL = Buffer.from(minifiedUrl).toString("base64");
  const b64OpeningProtocol = Buffer.from(openingProtocol).toString("base64");

  return `${b64URL}:${b64OpeningProtocol}`;
}

export async function shouldAlwaysOpenExternal(requestingURL: string, openingURL: string) {
  const key = getKey(requestingURL, openingURL);
  const alwaysOpen = await AlwaysOpenExternalDataStore.get(key);
  return alwaysOpen === true;
}

export async function setAlwaysOpenExternal(requestingURL: string, openingURL: string) {
  const key = getKey(requestingURL, openingURL);
  await AlwaysOpenExternalDataStore.set(key, true);
}

export async function unsetAlwaysOpenExternal(requestingURL: string, openingURL: string) {
  const key = getKey(requestingURL, openingURL);
  return await AlwaysOpenExternalDataStore.remove(key);
}

export async function getAlwaysOpenExternal() {
  const data = await AlwaysOpenExternalDataStore.getFullData();
  return Object.entries(data)
    .map(([key, value]) => {
      if (value !== true) return null;

      try {
        const [b64RequestingURL, b64OpeningProtocol] = key.split(":");
        const requestingURL = Buffer.from(b64RequestingURL, "base64").toString("utf-8");
        const openingProtocol = Buffer.from(b64OpeningProtocol, "base64").toString("utf-8");
        return { requestingURL, openingProtocol };
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}
