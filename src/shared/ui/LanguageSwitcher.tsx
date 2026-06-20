"use client";

import { Button, Stack } from "@mui/material";
import { useTransition } from "react";
import { setLocaleAction } from "@/shared/actions/locale";
import { useLocale } from "next-intl";

export function LanguageSwitcher() {
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  function switchTo(next: string) {
    startTransition(async () => {
      await setLocaleAction(next);
      window.location.reload();
    });
  }

  return (
    <Stack direction="row" spacing={0.5}>
      <Button
        size="small"
        variant={locale === "en" ? "contained" : "text"}
        color="inherit"
        onClick={() => switchTo("en")}
        disabled={isPending || locale === "en"}
        sx={{ minWidth: 0, px: 1, py: 0.25, fontSize: 12 }}
      >
        EN
      </Button>
      <Button
        size="small"
        variant={locale === "ru" ? "contained" : "text"}
        color="inherit"
        onClick={() => switchTo("ru")}
        disabled={isPending || locale === "ru"}
        sx={{ minWidth: 0, px: 1, py: 0.25, fontSize: 12 }}
      >
        RU
      </Button>
    </Stack>
  );
}
