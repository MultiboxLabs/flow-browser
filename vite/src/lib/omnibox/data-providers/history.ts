interface HistoryEntry {
  id: number;
  url: string;
  title: string;
  visitCount: number;
  typedCount: number; // How often typed directly
  lastVisitTime: number; // Timestamp
}

const MOCK_HISTORY_ENABLED = false;

const MOCK_HISTORY: HistoryEntry[] = [
  {
    id: 1,
    url: "https://www.google.com/",
    title: "Google",
    visitCount: 100,
    typedCount: 20,
    lastVisitTime: Date.now() - 86400000 * 1
  },
  {
    id: 2,
    url: "https://github.com/",
    title: "GitHub",
    visitCount: 50,
    typedCount: 10,
    lastVisitTime: Date.now() - 86400000 * 2
  },
  {
    id: 3,
    url: "https://stackoverflow.com/questions",
    title: "Stack Overflow - Questions",
    visitCount: 80,
    typedCount: 5,
    lastVisitTime: Date.now() - 3600000 * 5
  },
  {
    id: 4,
    url: "https://developer.mozilla.org/en-US/",
    title: "MDN Web Docs",
    visitCount: 30,
    typedCount: 2,
    lastVisitTime: Date.now() - 86400000 * 7
  },
  {
    id: 5,
    url: "http://localhost:3000/",
    title: "Local Dev Server",
    visitCount: 200,
    typedCount: 50,
    lastVisitTime: Date.now() - 3600000 * 1
  },
  {
    id: 6,
    url: "https://news.ycombinator.com/",
    title: "Hacker News",
    visitCount: 60,
    typedCount: 8,
    lastVisitTime: Date.now() - 86400000 * 3
  }
];

export async function getHistory() {
  if (MOCK_HISTORY_ENABLED) {
    return MOCK_HISTORY;
  }
  return [];
}
