"use client";

import {
  Alert,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import type { SessionCommitStatus } from "@/shared/lib/use-session-commit";

type SessionSaveGateProps = {
  status: SessionCommitStatus;
  onRetry: () => void;
  children: ReactNode;
};

// Shows the completion screen only once the session is stored, so its
// navigation buttons can never race ahead of the save.
export function SessionSaveGate({
  status,
  onRetry,
  children,
}: SessionSaveGateProps) {
  const t = useTranslations("Common");

  if (status === "saved") return children;

  return (
    <Stack
      spacing={3}
      alignItems="center"
      justifyContent="center"
      sx={{ minHeight: "60vh" }}
    >
      {status === "error" ? (
        <>
          <Alert severity="error" sx={{ width: "100%", maxWidth: 360 }}>
            {t("saveResultsFailed")}
          </Alert>
          <Button variant="contained" onClick={onRetry}>
            {t("retry")}
          </Button>
        </>
      ) : (
        <>
          <CircularProgress />
          <Typography variant="body1" color="text.secondary">
            {t("savingResults")}
          </Typography>
        </>
      )}
    </Stack>
  );
}
