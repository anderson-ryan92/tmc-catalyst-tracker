import { useState, useEffect } from "react";

/**
 * Simple hash-based router. No dependencies.
 * Usage: const page = useHashRoute(); // returns "" for home, "calculator" for #calculator, etc.
 */
export function useHashRoute() {
  const getHash = () => window.location.hash.replace("#", "") || "";
  const [page, setPage] = useState(getHash);

  useEffect(() => {
    const handler = () => setPage(getHash());
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  return page;
}

export function navigate(page) {
  window.location.hash = page;
}
