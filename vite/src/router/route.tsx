import { useRouter } from "./provider";

type RouteProps = {
  protocol?: string;
  hostname?: string;
  children: React.ReactNode;
};

export function Route({ protocol, hostname, children }: RouteProps) {
  const { protocol: currentProtocol, hostname: currentHostname } = useRouter();

  if (protocol && currentProtocol !== protocol) {
    return null;
  }

  if (hostname && currentHostname !== hostname) {
    return null;
  }

  return children;
}
