"use client";

import { useEffect, useState } from "react";

export function useNetworkStatus() {
  const [offline, setOffline] = useState(
    () => typeof navigator !== "undefined" && !navigator.onLine
  );

  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  return {
    offline,
    isOnline: !offline,
    refresh: () => setOffline(!navigator.onLine),
  };
}
