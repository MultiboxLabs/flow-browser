import { FrownIcon, RefreshCwIcon, ArrowLeftIcon, Gamepad2Icon } from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";

function Page() {
  const params = new URLSearchParams(window.location.search);
  const errorCode = params.get("errorCode") || "-105";
  const url = params.get("url");

  const info = {
    "-6": {
      title: "Your file was not found",
      description: `It may have been moved or deleted.`,
      code: "ERR_FILE_NOT_FOUND"
    },
    "-10": {
      title: "This site can't be reached",
      description: `The webpage at <b>${url}</b> might be temporarily down or it may have moved permanently to a new web address.`,
      code: "ERR_ACCESS_DENIED"
    },
    "-105": {
      title: "This site can't be reached",
      description: `<b>${url}</b>'s server IP address could not be found.`,
      code: "ERR_NAME_NOT_RESOLVED"
    },
    "-106": {
      title: "No internet",
      description: `Try: <ul><li>Checking the network cables, modem, and router</li><li>Reconnecting to Wi-Fi</li></ul>`,
      code: "ERR_INTERNET_DISCONNECTED"
    },
    "-108": {
      title: "This site can't be reached",
      description: `The webpage at <b>${url}</b> might be temporarily down or it may have moved permanently to a new web address.`,
      code: "ERR_ADDRESS_INVALID"
    },
    "-109": {
      title: "This site can't be reached",
      description: `<b>${url}</b> is unreachable.`,
      code: "ERR_ADDRESS_UNREACHABLE"
    },
    "-300": {
      title: "This site can't be reached",
      description: `The webpage at <b>${url}</b> might be temporarily down or it may have moved permanently to a new web address.`,
      code: "ERR_INVALID_URL"
    },
    "-379": {
      title: "This site can't be reached",
      description: `The webpage at <b>${url}</b> might be temporarily down or it may have moved permanently to a new web address.`,
      code: "ERR_HTTP_RESPONSE_CODE_FAILURE"
    }
  };

  const errorInfo = info[errorCode as keyof typeof info] || info["-105"];

  const handleReload = () => {
    if (!url) return;
    window.location.replace(url);
  };

  const canGoBack = window.history.length > 1;

  const handleGoBack = () => {
    window.history.back();
  };

  useEffect(() => {
    const initial = params.get("initial");
    if (initial) {
      // remove initial param
      const newURL = new URL(window.location.href);
      newURL.searchParams.delete("initial");
      window.history.replaceState({}, "", newURL.toString());
    } else {
      handleReload();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!url) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-zinc-900 text-gray-800 dark:text-zinc-200 flex flex-col items-center pt-24 px-4 transition-colors duration-300">
      <title>{url || "Error"}</title>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md flex flex-col items-center"
      >
        {/* Sad face icon */}
        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ duration: 0.5 }}>
          <FrownIcon className="w-16 h-16 mb-4 text-gray-700 dark:text-zinc-300" />
        </motion.div>

        {/* Error title */}
        <h1 className="text-2xl font-medium mb-4 text-center">{errorInfo.title}</h1>

        {/* Error description */}
        <div
          className="text-gray-600 dark:text-zinc-400 mb-6 text-center"
          dangerouslySetInnerHTML={{ __html: errorInfo.description }}
        />

        {/* Error code */}
        <div className="text-gray-500 dark:text-zinc-500 text-sm mb-8">{errorInfo.code}</div>

        {/* Buttons */}
        <div className="flex gap-3">
          {/* Go back button */}
          {canGoBack && (
            <motion.button
              onClick={handleGoBack}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-gray-800 dark:text-zinc-200 px-6 py-2 rounded-full text-sm font-medium transition-colors duration-200 shadow-md"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Go Back
            </motion.button>
          )}

          {/* Reload button */}
          <motion.button
            onClick={handleReload}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white px-6 py-2 rounded-full text-sm font-medium transition-colors duration-200 shadow-md"
          >
            <RefreshCwIcon className="w-4 h-4" />
            Reload
          </motion.button>
        </div>

        {/* Games section */}
        <div className="mt-8 flex flex-col items-center">
          <p className="text-gray-600 dark:text-zinc-400 mb-3">Want to play some games?</p>
          <motion.button
            onClick={() => window.open("flow://games", "_blank")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700 text-white px-6 py-2 rounded-full text-sm font-medium transition-colors duration-200 shadow-md"
          >
            <Gamepad2Icon className="w-4 h-4" />
            Game Library
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

export default Page;
