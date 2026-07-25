"use client";

import { Box } from "@mui/material";
import type { ReactNode } from "react";

// Reserve space at the bottom of scrollable content so it never hides
// behind the fixed StudyActionBar. Sized for a single row of buttons
// (with room for label wrap on narrow screens) plus the bar's own padding.
export const STUDY_ACTION_BAR_OFFSET = "140px";

type StudyActionBarProps = {
  children: ReactNode;
};

export function StudyActionBar({ children }: StudyActionBarProps) {
  return (
    <Box
      sx={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: (theme) => theme.zIndex.appBar,
        bgcolor: "background.default",
        borderTop: "1px solid",
        borderColor: "divider",
        px: 2,
        pt: 1.5,
        pb: "calc(12px + env(safe-area-inset-bottom))",
      }}
    >
      <Box sx={{ maxWidth: "sm", mx: "auto" }}>{children}</Box>
    </Box>
  );
}
