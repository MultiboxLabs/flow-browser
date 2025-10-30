import { getPathNoStrict } from "hono/utils/url";

export interface AllowedDomains {
  [key: string]: true | string;
}

export interface ServeStaticFileOptions {
  overrideRouteName?: string;
}

export function transformPathForRequest(request: Request) {
  const realPath = getPathNoStrict(request);
  if (!realPath) {
    return realPath;
  }

  const url = URL.parse(request.url);
  // 'unknown-hostname' as default hostname to prevent weird behaviors when no hostname is present
  const hostname = url?.hostname ?? "unknown-hostname";
  return `/${hostname}${realPath}`;
}
