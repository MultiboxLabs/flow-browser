import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ConditionalPasskeyRequest } from "~/types/passkey";

interface PasskeysRequestContextValue {
  conditionalRequests: ConditionalPasskeyRequest[];
}

const PasskeysRequestContext = createContext<PasskeysRequestContextValue | null>(null);

export function usePasskeyRequests() {
  const context = useContext(PasskeysRequestContext);
  if (!context) {
    throw new Error("usePasskeyRequests must be used within a PasskeysRequestProvider");
  }
  return context;
}

interface PasskeysRequestProviderProps {
  children: React.ReactNode;
}

export function PasskeysRequestProvider({ children }: PasskeysRequestProviderProps) {
  const [conditionalRequests, setConditionalRequests] = useState<ConditionalPasskeyRequest[]>([]);

  const fetchConditionalRequests = useCallback(async () => {
    const requests = await flow.passkey.getConditionalRequests();
    setConditionalRequests(requests);
  }, []);

  useEffect(() => {
    fetchConditionalRequests();

    const unsub = flow.passkey.onConditionalRequestsUpdated((requests) => {
      setConditionalRequests(requests);
    });

    return () => unsub();
  }, [fetchConditionalRequests]);

  return <PasskeysRequestContext.Provider value={{ conditionalRequests }}>{children}</PasskeysRequestContext.Provider>;
}
