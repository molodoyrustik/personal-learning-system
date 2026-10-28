"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SessionCommitStatus = "idle" | "saving" | "saved" | "error";

// Persists a finished study session exactly once, as soon as `ready` flips
// to true, and tracks the request so the completion screen can hold
// navigation until the results are actually stored (see SessionSaveGate) —
// and offer a retry when they aren't.
export function useSessionCommit(
  commit: () => Promise<unknown>,
  ready: boolean,
) {
  const [status, setStatus] = useState<SessionCommitStatus>("idle");
  const commitRef = useRef(commit);
  commitRef.current = commit;
  const startedRef = useRef(false);

  const run = useCallback(async () => {
    setStatus("saving");
    try {
      await commitRef.current();
      setStatus("saved");
    } catch (error) {
      console.error("Failed to save session results", error);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    if (!ready || startedRef.current) return;
    startedRef.current = true;
    void run();
  }, [ready, run]);

  return { status, retry: run };
}
