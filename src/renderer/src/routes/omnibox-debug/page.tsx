import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, RotateCw, Search, Info, List } from "lucide-react";
import { requestOmniboxSuggestions } from "@/lib/omnibox-new";
import { primeOpenTabsCache, primeQuickHistoryCache } from "@/lib/omnibox-new/suggestors";
import { setOmniboxCurrentProfileId, setOmniboxCurrentSpaceId } from "@/lib/omnibox-new/states";
import type { OmniboxSuggestion } from "@/lib/omnibox-new/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSpaces } from "@/components/providers/spaces-provider";

function suggestionLabel(suggestion: OmniboxSuggestion): string {
  switch (suggestion.type) {
    case "search":
      return suggestion.query;
    case "website":
    case "open-tab":
    case "pedal":
      return suggestion.title;
  }
}

function suggestionValue(suggestion: OmniboxSuggestion): string {
  switch (suggestion.type) {
    case "search":
    case "website":
    case "open-tab":
      return suggestion.url;
    case "pedal":
      return suggestion.action;
  }
}

function suggestionSourceLabel(suggestion: OmniboxSuggestion): string {
  return suggestion.source.replace(/-/g, " ");
}

function Page() {
  const { currentSpace } = useSpaces();
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<OmniboxSuggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<OmniboxSuggestion | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestIdRef = useRef(0);
  const [activeTab, setActiveTab] = useState("details");

  const requestSuggestions = useCallback(
    (nextInput: string) => {
      const profileId = currentSpace?.profileId;
      setOmniboxCurrentProfileId(profileId);
      setOmniboxCurrentSpaceId(currentSpace?.id);

      const requestId = ++requestIdRef.current;
      requestOmniboxSuggestions({
        input: nextInput,
        requestId,
        getCurrentRequestId: () => requestIdRef.current,
        applySuggestions: (items) => {
          setSuggestions(items);
          setSelectedSuggestion(null);
        }
      });
    },
    [currentSpace?.id, currentSpace?.profileId]
  );

  useEffect(() => {
    setOmniboxCurrentProfileId(currentSpace?.profileId);
    setOmniboxCurrentSpaceId(currentSpace?.id);
    void primeQuickHistoryCache(currentSpace?.profileId, { force: true });
    void primeOpenTabsCache(currentSpace?.id, { force: true });
  }, [currentSpace?.id, currentSpace?.profileId, requestSuggestions]);

  useEffect(() => {
    requestSuggestions(input);
  }, [input, requestSuggestions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleInputFocus = () => {
    requestSuggestions(input);
  };

  const handleSuggestionClick = (suggestion: OmniboxSuggestion) => {
    setSelectedSuggestion(suggestion);
    setActiveTab("details");
  };

  const closeDetails = () => {
    setSelectedSuggestion(null);
  };

  const clearInput = () => {
    setInput("");
    setSuggestions([]);
    setSelectedSuggestion(null);
  };

  const forceFocus = () => {
    inputRef.current?.focus();
  };

  const setDebugInput = (nextInput: string) => {
    setInput(nextInput);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  const sourceTypes = useMemo(
    () => Array.from(new Set(suggestions.map((suggestion) => suggestionSourceLabel(suggestion)))),
    [suggestions]
  );

  const matchTypes = useMemo(
    () => Array.from(new Set(suggestions.map((suggestion) => suggestion.type))),
    [suggestions]
  );

  return (
    <div className="flex h-screen flex-col gap-4 p-4">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="text-xl font-semibold">Omnibox Debugger</h1>
      </motion.div>

      <motion.div
        className="flex items-center gap-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="relative flex-grow">
          <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            placeholder="Enter search query..."
            autoFocus
            className="pr-10 pl-8"
          />
          {input ? (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1 right-1 h-8 w-8"
              onClick={clearInput}
              title="Clear input"
            >
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
        <Button variant="outline" size="icon" onClick={forceFocus} title="Refocus input">
          <RotateCw className="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setDebugInput("")} className="text-xs whitespace-nowrap">
          Test Empty
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setDebugInput("r")} className="text-xs whitespace-nowrap">
          {'Test "r"'}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setDebugInput("onboarding")}
          className="text-xs whitespace-nowrap"
        >
          Test Pedal
        </Button>
      </motion.div>

      <div className="grid flex-grow grid-cols-1 gap-4 overflow-hidden md:grid-cols-2">
        <motion.div
          className="flex h-full flex-col overflow-hidden"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="flex flex-grow flex-col overflow-hidden">
            <CardHeader className="border-b px-4 py-2">
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <List className="h-4 w-4" /> Suggestions ({suggestions.length})
              </CardTitle>
            </CardHeader>
            <ScrollArea className="flex-grow">
              <AnimatePresence mode="wait">
                {suggestions.length > 0 ? (
                  <motion.div
                    key="suggestions-list"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[80px] px-2 py-1">Type</TableHead>
                          <TableHead className="px-2 py-1">Content</TableHead>
                          <TableHead className="hidden px-2 py-1 lg:table-cell">Value</TableHead>
                          <TableHead className="w-[80px] px-2 py-1 text-right">Score</TableHead>
                          <TableHead className="w-[120px] px-2 py-1">Source</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {suggestions.map((suggestion, index) => (
                          <motion.tr
                            key={`${suggestion.type}-${suggestionValue(suggestion)}-${index}`}
                            className={`cursor-pointer text-sm hover:bg-accent/50 ${selectedSuggestion === suggestion ? "bg-accent" : ""}`}
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.15, delay: index * 0.02 }}
                            onClick={() => handleSuggestionClick(suggestion)}
                            layout
                          >
                            <TableCell className="align-top px-2 py-1.5">
                              <Badge
                                variant={selectedSuggestion === suggestion ? "default" : "outline"}
                                className="text-xs font-normal whitespace-nowrap"
                              >
                                {suggestion.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="align-top px-2 py-1.5 font-medium">
                              {suggestionLabel(suggestion)}
                            </TableCell>
                            <TableCell className="hidden max-w-0 align-top px-2 py-1.5 font-mono text-xs text-muted-foreground lg:table-cell">
                              <span className="block truncate">{suggestionValue(suggestion)}</span>
                            </TableCell>
                            <TableCell className="px-2 py-1.5 text-right align-top">
                              {Math.round(suggestion.relevance)}
                            </TableCell>
                            <TableCell className="px-2 py-1.5 align-top text-xs text-muted-foreground">
                              {suggestionSourceLabel(suggestion)}
                            </TableCell>
                          </motion.tr>
                        ))}
                      </TableBody>
                    </Table>
                  </motion.div>
                ) : input ? (
                  <motion.div
                    key="no-suggestions"
                    className="flex h-full flex-col items-center justify-center py-8 text-center text-muted-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Search className="mb-3 h-10 w-10 text-muted-foreground/50" />
                    {'No suggestions found for "'}
                    {input}
                    {'"'}
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty-state"
                    className="flex h-full flex-col items-center justify-center py-8 text-center text-muted-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Search className="mb-3 h-10 w-10 text-muted-foreground/50" />
                    Type to request omnibox suggestions.
                    <span className="mt-1 text-xs text-muted-foreground/70">
                      Empty input currently returns no rows.
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </ScrollArea>
          </Card>
        </motion.div>

        <motion.div
          className="flex h-full flex-col overflow-hidden"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-grow flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">
                <Info className="mr-1 h-4 w-4" /> Details
              </TabsTrigger>
              <TabsTrigger value="debug">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="mr-1 h-4 w-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM10.73 5.73a.75.75 0 0 0-1.06 1.06l2.47 2.47H6.75a.75.75 0 0 0 0 1.5h5.39l-2.47 2.47a.75.75 0 1 0 1.06 1.06l3.75-3.75a.75.75 0 0 0 0-1.06l-3.75-3.75Zm3.53 9.53a.75.75 0 0 0 1.06-1.06l-2.47-2.47h5.39a.75.75 0 0 0 0-1.5h-5.39l2.47-2.47a.75.75 0 1 0-1.06-1.06l-3.75 3.75a.75.75 0 0 0 0 1.06l3.75 3.75Z"
                    clipRule="evenodd"
                  />
                </svg>
                Debug Info
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-0 flex-grow overflow-hidden">
              <Card className="flex h-full flex-col rounded-t-none border-t-0">
                <AnimatePresence mode="wait">
                  {selectedSuggestion ? (
                    <motion.div
                      key="details-content"
                      className="flex flex-grow flex-col overflow-hidden"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <CardHeader className="flex flex-row items-center justify-between border-b px-4 py-2">
                        <CardTitle className="truncate text-base font-medium">
                          {suggestionLabel(selectedSuggestion)}
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 flex-shrink-0"
                          onClick={closeDetails}
                          title="Close details"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </CardHeader>
                      <ScrollArea className="flex-grow">
                        <CardContent className="space-y-3 p-4 text-sm">
                          <div className="flex items-center justify-between rounded bg-secondary/30 p-2">
                            <div>
                              <span className="font-medium text-muted-foreground">Type:</span> {selectedSuggestion.type}
                            </div>
                            <Badge variant="outline">{Math.round(selectedSuggestion.relevance)}</Badge>
                          </div>
                          <div>
                            <span className="font-medium text-muted-foreground">Source:</span>{" "}
                            {suggestionSourceLabel(selectedSuggestion)}
                          </div>
                          <div>
                            <span className="font-medium text-muted-foreground">Primary Label:</span>
                            <div className="mt-1 rounded bg-secondary/30 p-2">
                              {suggestionLabel(selectedSuggestion)}
                            </div>
                          </div>
                          <div>
                            <span className="font-medium text-muted-foreground">Value:</span>
                            <div className="mt-1 break-all rounded bg-secondary/30 p-2 font-mono text-xs">
                              {suggestionValue(selectedSuggestion)}
                            </div>
                          </div>
                          {selectedSuggestion.type === "open-tab" ? (
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <div>
                                <span className="font-medium text-muted-foreground">Tab ID:</span>
                                <div className="mt-1 rounded bg-secondary/30 p-2 font-mono text-xs">
                                  {selectedSuggestion.tabId}
                                </div>
                              </div>
                              <div>
                                <span className="font-medium text-muted-foreground">Space ID:</span>
                                <div className="mt-1 rounded bg-secondary/30 p-2 font-mono text-xs">
                                  {selectedSuggestion.spaceId}
                                </div>
                              </div>
                            </div>
                          ) : null}
                        </CardContent>
                      </ScrollArea>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="no-details-selected"
                      className="flex h-full flex-col items-center justify-center p-6 text-center text-muted-foreground"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Info className="mb-3 h-10 w-10 text-muted-foreground/50" />
                      <p>
                        Select a suggestion from the list <br />
                        to view its details here.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </TabsContent>

            <TabsContent value="debug" className="mt-0 flex-grow overflow-hidden">
              <Card className="flex h-full flex-col rounded-t-none border-t-0">
                <CardHeader className="border-b px-4 py-2">
                  <CardTitle className="text-base font-medium">Current State</CardTitle>
                </CardHeader>
                <ScrollArea className="flex-grow">
                  <CardContent className="p-4 text-sm">
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <span className="font-medium text-muted-foreground">Input:</span>
                        <span className="ml-2 rounded bg-secondary/30 p-1 font-mono">{`"${input}"`}</span>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Input Length:</span>
                        <span className="ml-2">{input.length}</span>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Suggestion Count:</span>
                        <span className="ml-2">{suggestions.length}</span>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Current Space:</span>
                        <span className="ml-2">{currentSpace?.name ?? "None"}</span>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Current Profile ID:</span>
                        <span className="ml-2 rounded bg-secondary/30 p-1 font-mono text-xs">
                          {currentSpace?.profileId ?? "None"}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Suggestion Sources:</span>
                        <span className="ml-2">{sourceTypes.join(", ") || "None"}</span>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Match Types:</span>
                        <div className="mt-1 space-x-1">
                          {matchTypes.length > 0 ? (
                            matchTypes.map((type) => (
                              <Badge key={type} variant="secondary">
                                {type}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground/80">None</span>
                          )}
                        </div>
                      </div>
                      {selectedSuggestion ? (
                        <div className="mt-4 border-t pt-4">
                          <h4 className="mb-2 font-medium text-muted-foreground">Selected Suggestion Raw:</h4>
                          <pre className="overflow-x-auto rounded bg-secondary/20 p-2 text-xs">
                            {JSON.stringify(selectedSuggestion, null, 2)}
                          </pre>
                        </div>
                      ) : null}
                    </div>
                  </CardContent>
                </ScrollArea>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}

function App() {
  return (
    <>
      <title>Omnibox Debugger</title>
      <div className="h-full w-full bg-background">
        <Page />
      </div>
    </>
  );
}

export default App;
