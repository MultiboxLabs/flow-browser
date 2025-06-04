import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, RotateCw, Search, Info, List } from "lucide-react";
import { Omnibox, OmniboxUpdateCallback } from "@/lib/omnibox/omnibox";
import { AutocompleteMatch } from "@/lib/omnibox/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function Page() {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<AutocompleteMatch[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<AutocompleteMatch | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const omniboxRef = useRef<Omnibox | null>(null);
  const [activeTab, setActiveTab] = useState("details");

  useEffect(() => {
    // Initialize the Omnibox with a callback to update suggestions
    const handleSuggestionsUpdate: OmniboxUpdateCallback = (results) => {
      setSuggestions(results);
      // Clear the selected suggestion when the suggestion list changes
      setSelectedSuggestion(null);
    };

    omniboxRef.current = new Omnibox(handleSuggestionsUpdate, {
      hasZeroSuggest: true,
      hasPedals: true
    });

    // Cleanup on unmount
    return () => {
      if (omniboxRef.current) {
        omniboxRef.current.stopQuery();
      }
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInput(newValue);
    if (omniboxRef.current) {
      omniboxRef.current.handleInput(newValue, "keystroke");
    }
  };

  const handleInputFocus = () => {
    if (omniboxRef.current) {
      omniboxRef.current.handleInput(input, "focus");
    }
  };

  const handleInputBlur = () => {
    // Don't stop the query immediately to allow the user to interact with suggestions
    // We'll handle stopping the query when navigating away from the page
  };

  const handleSuggestionClick = (suggestion: AutocompleteMatch) => {
    setSelectedSuggestion(suggestion);
    setActiveTab("details");
  };

  const closeDetails = () => {
    setSelectedSuggestion(null);
  };

  const clearInput = () => {
    setInput("");
    if (omniboxRef.current) {
      omniboxRef.current.stopQuery();
      setSuggestions([]);
    }
  };

  const forceFocus = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const simulateZeroSuggest = () => {
    clearInput();
    setTimeout(() => {
      if (inputRef.current && omniboxRef.current) {
        inputRef.current.focus();
        omniboxRef.current.handleInput("", "focus");
      }
    }, 100);
  };

  return (
    <div className="flex flex-col h-screen p-4 gap-4">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="text-xl font-semibold">Omnibox Debugger</h1>
      </motion.div>

      <motion.div
        className="flex gap-2 items-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="relative flex-grow">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder="Enter search query..."
            autoFocus
            className="pl-8 pr-10"
          />
          {input && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1 h-8 w-8"
              onClick={clearInput}
              title="Clear input"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Button variant="outline" size="icon" onClick={forceFocus} title="Refocus input">
          <RotateCw className="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="sm" onClick={simulateZeroSuggest} className="text-xs whitespace-nowrap">
          Test Zero Suggest
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setInput("r");
            if (omniboxRef.current) {
              omniboxRef.current.handleInput("r", "keystroke");
            }
          }}
          className="text-xs whitespace-nowrap"
        >
          {'Test "r"'}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setInput("onboarding");
            if (omniboxRef.current) {
              omniboxRef.current.handleInput("onboarding", "keystroke");
            }
          }}
          className="text-xs whitespace-nowrap"
        >
          Test Pedal
        </Button>
      </motion.div>

      <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden">
        <motion.div
          className="flex flex-col h-full overflow-hidden"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="flex-grow flex flex-col overflow-hidden">
            <CardHeader className="py-2 px-4 border-b">
              <CardTitle className="text-base font-medium flex items-center gap-2">
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
                          <TableHead className="w-[70px] px-2 py-1">Type</TableHead>
                          <TableHead className="px-2 py-1">Content</TableHead>
                          <TableHead className="w-[70px] text-right px-2 py-1">Score</TableHead>
                          <TableHead className="w-[100px] hidden lg:table-cell px-2 py-1">Provider</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {suggestions.map((suggestion, index) => (
                          <motion.tr
                            key={suggestion.contents + suggestion.providerName + index}
                            className={`cursor-pointer hover:bg-accent/50 text-sm ${selectedSuggestion === suggestion ? "bg-accent" : ""}`}
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.15, delay: index * 0.02 }}
                            onClick={() => handleSuggestionClick(suggestion)}
                            layout
                          >
                            <TableCell className="align-top px-2 py-1.5">
                              <Badge
                                variant={selectedSuggestion === suggestion ? "default" : "outline"}
                                className="font-normal text-xs whitespace-nowrap"
                              >
                                {suggestion.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium align-top px-2 py-1.5">{suggestion.contents}</TableCell>
                            <TableCell className="text-right align-top px-2 py-1.5">{suggestion.relevance}</TableCell>
                            <TableCell className="text-xs text-muted-foreground align-top hidden lg:table-cell px-2 py-1.5">
                              {suggestion.providerName}
                            </TableCell>
                          </motion.tr>
                        ))}
                      </TableBody>
                    </Table>
                  </motion.div>
                ) : input ? (
                  <motion.div
                    key="no-suggestions"
                    className="flex flex-col items-center justify-center h-full text-center py-8 text-muted-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Search className="h-10 w-10 mb-3 text-muted-foreground/50" />
                    {'No suggestions found for "{input}"'}
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty-state"
                    className="flex flex-col items-center justify-center h-full text-center py-8 text-muted-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Search className="h-10 w-10 mb-3 text-muted-foreground/50" />
                    Start typing or use test buttons
                  </motion.div>
                )}
              </AnimatePresence>
            </ScrollArea>
          </Card>
        </motion.div>

        <motion.div
          className="flex flex-col h-full overflow-hidden"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-grow flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">
                <Info className="h-4 w-4 mr-1" /> Details
              </TabsTrigger>
              <TabsTrigger value="debug">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-4 w-4 mr-1"
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

            <TabsContent value="details" className="flex-grow overflow-hidden mt-0">
              <Card className="h-full flex flex-col border-t-0 rounded-t-none">
                <AnimatePresence mode="wait">
                  {selectedSuggestion ? (
                    <motion.div
                      key="details-content"
                      className="flex-grow flex flex-col overflow-hidden"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <CardHeader className="py-2 px-4 flex flex-row items-center justify-between border-b">
                        <CardTitle className="text-base font-medium truncate">{selectedSuggestion.contents}</CardTitle>
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
                        <CardContent className="p-4 text-sm space-y-3">
                          <div className="flex justify-between items-center bg-secondary/30 p-2 rounded">
                            <div>
                              <span className="font-medium text-muted-foreground">Type:</span> {selectedSuggestion.type}
                            </div>
                            <Badge variant="outline">{selectedSuggestion.relevance}</Badge>
                          </div>
                          <div>
                            <span className="font-medium text-muted-foreground">Provider:</span>{" "}
                            {selectedSuggestion.providerName}
                          </div>

                          {selectedSuggestion.description && (
                            <div>
                              <span className="font-medium text-muted-foreground">Description:</span>
                              <p className="mt-1 text-muted-foreground/80">{selectedSuggestion.description}</p>
                            </div>
                          )}

                          <div>
                            <span className="font-medium text-muted-foreground">Destination URL:</span>
                            <div className="text-xs break-all mt-1 bg-secondary/30 p-2 rounded font-mono">
                              {selectedSuggestion.destinationUrl}
                            </div>
                          </div>

                          {selectedSuggestion.inlineCompletion && (
                            <div>
                              <span className="font-medium text-muted-foreground">Inline Completion:</span>
                              <p className="mt-1 font-mono bg-secondary/30 p-1 rounded inline-block">
                                {'"{selectedSuggestion.inlineCompletion}"'}
                              </p>
                            </div>
                          )}

                          {selectedSuggestion.isDefault && (
                            <div className="bg-green-100 p-2 rounded dark:bg-green-900/30 text-green-800 dark:text-green-200">
                              <span className="font-medium">Default Match</span>
                            </div>
                          )}
                        </CardContent>
                      </ScrollArea>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="no-details-selected"
                      className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-6"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Info className="h-10 w-10 mb-3 text-muted-foreground/50" />
                      <p>
                        Select a suggestion from the list <br />
                        to view its details here.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </TabsContent>

            <TabsContent value="debug" className="flex-grow overflow-hidden mt-0">
              <Card className="h-full flex flex-col border-t-0 rounded-t-none">
                <CardHeader className="py-2 px-4 border-b">
                  <CardTitle className="text-base font-medium">Current State</CardTitle>
                </CardHeader>
                <ScrollArea className="flex-grow">
                  <CardContent className="p-4 text-sm">
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <span className="font-medium text-muted-foreground">Input:</span>
                        <span className="ml-2 font-mono bg-secondary/30 p-1 rounded">{`"${input}"`}</span>
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
                        <span className="font-medium text-muted-foreground">Provider Types:</span>
                        <span className="ml-2">
                          {Array.from(new Set(suggestions.map((s) => s.providerName))).join(", ") || "None"}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Match Types:</span>
                        <div className="mt-1 space-x-1">
                          {suggestions.length > 0 ? (
                            Array.from(new Set(suggestions.map((s) => s.type))).map((type, i) => (
                              <Badge key={i} variant="secondary">
                                {type}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground/80">None</span>
                          )}
                        </div>
                      </div>
                      {selectedSuggestion && (
                        <div className="mt-4 pt-4 border-t">
                          <h4 className="font-medium mb-2 text-muted-foreground">Selected Suggestion Raw:</h4>
                          <pre className="text-xs bg-secondary/20 p-2 rounded overflow-x-auto">
                            {JSON.stringify(selectedSuggestion, null, 2)}
                          </pre>
                        </div>
                      )}
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
      <div className="w-full h-full bg-background">
        <Page />
      </div>
    </>
  );
}

export default App;
