import { Extension } from "../components/ExtensionCard";

export const mockExtensions: Extension[] = [
  {
    id: "nkbihfbeogaeaoehlefnkodbefgpgknn",
    name: "Bitwarden Password Manager",
    description:
      "At home, at work, or on the go, Bitwarden easily secures all your passwords, passkeys, and sensitive information",
    icon: "https://bitwarden.com/icons/icon-48x48.png",
    enabled: true,
    version: "2024.2.1",
    path: "/Users/user/Library/Application Support/Flow/Extensions/bitwarden",
    size: "61.7 MB",
    permissions: [
      "Read your browsing history",
      "Display notifications",
      "Read and modify data you copy and paste",
      "Change your privacy-related settings"
    ],
    inspectViews: ["service_worker"]
  },
  {
    id: "bcjindcccaagfpapjjmafapmmgkkhgoa",
    name: "JSON Formatter",
    description: "Makes JSON easy to read. Open source.",
    icon: "https://jsonformatter.org/img/favicon.png",
    enabled: true,
    version: "0.8.0",
    path: "/Users/user/Library/Application Support/Flow/Extensions/json-formatter"
  },
  {
    id: "fmkadmapgofadopljbjfkapdkoienihi",
    name: "React Developer Tools",
    description: "Adds React debugging tools to the Chrome Developer Tools.",
    icon: "https://reactjs.org/favicon.ico",
    enabled: true,
    version: "4.28.1",
    path: "/Users/user/Library/Application Support/Flow/Extensions/react-devtools"
  }
];
