import { ReactNode, useEffect, useState } from "react";

export default function Route() {
  const [Page, setPage] = useState<ReactNode>(null);

  useEffect(() => {
    import("./page").then((module) => {
      const Page = module.default;
      setPage(<Page />);
    });
  }, []);

  return Page;
}
