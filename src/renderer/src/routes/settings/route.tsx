import { ReactNode, useEffect, useState } from "react";
import { ThemeProvider } from "@/components/main/theme";

export default function Route() {
  const [Page, setPage] = useState<ReactNode>(<div className="h-screen w-screen bg-background"></div>);

  useEffect(() => {
    import("./page").then((module) => {
      const Page = module.default;
      setPage(<Page />);
    });
  }, []);

  return <ThemeProvider>{Page}</ThemeProvider>;
}
