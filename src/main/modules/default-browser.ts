import { app } from "electron";

export function isDefaultBrowser() {
  const httpIsDefault = app.isDefaultProtocolClient("http");
  const httpsIsDefault = app.isDefaultProtocolClient("https");

  return httpIsDefault && httpsIsDefault;
}

export function setDefaultBrowser() {
  const httpSucceed = app.setAsDefaultProtocolClient("http");
  const httpsSucceed = app.setAsDefaultProtocolClient("https");

  return httpSucceed || httpsSucceed;
}
