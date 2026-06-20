"use client";

import {
  Button,
  Card,
  CardContent,
  Divider,
  Drawer,
  IconButton,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { generateId } from "@/shared/lib/ids";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ImportedSentence = {
  id: string;
  sourceText: string;
  targetText: string;
};

type PairSep = "pipe" | "dash" | "custom";
type ItemSep = "newline" | "semicolon" | "custom";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveItemSep(itemSep: ItemSep, custom: string): string {
  if (itemSep === "newline") return "\n";
  if (itemSep === "semicolon") return ";";
  return custom;
}

function resolvePairSep(pairSep: PairSep, custom: string): string {
  if (pairSep === "pipe") return "|";
  if (pairSep === "dash") return " - ";
  return custom;
}

function parseSentences(
  raw: string,
  pairSep: string,
  itemSep: string,
): ImportedSentence[] {
  if (!raw.trim() || !pairSep || !itemSep) return [];
  return raw
    .split(itemSep)
    .map((item) => {
      const idx = item.indexOf(pairSep);
      if (idx === -1) return null;
      const sourceText = item.slice(0, idx).trim();
      const targetText = item.slice(idx + pairSep.length).trim();
      if (!sourceText || !targetText) return null;
      return { id: generateId(), sourceText, targetText };
    })
    .filter((s): s is ImportedSentence => s !== null);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type ImportSentencesDrawerProps = {
  open: boolean;
  onClose: () => void;
  onImport: (sentences: ImportedSentence[]) => void;
};

export function ImportSentencesDrawer({
  open,
  onClose,
  onImport,
}: ImportSentencesDrawerProps) {
  const t = useTranslations("Import");
  const tCommon = useTranslations("Common");
  const [raw, setRaw] = useState("");
  const [pairSep, setPairSep] = useState<PairSep>("pipe");
  const [customPairSep, setCustomPairSep] = useState("");
  const [itemSep, setItemSep] = useState<ItemSep>("newline");
  const [customItemSep, setCustomItemSep] = useState("");

  const resolvedPairSep = resolvePairSep(pairSep, customPairSep);
  const resolvedItemSep = resolveItemSep(itemSep, customItemSep);
  const parsed = parseSentences(raw, resolvedPairSep, resolvedItemSep);

  function handleImport() {
    if (parsed.length === 0) return;
    onImport(parsed);
    setRaw("");
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: "100%", sm: 420 }, p: 3 } }}
    >
      <Stack spacing={3} sx={{ height: "100%", overflowY: "auto" }}>
        {/* Header */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="h2">{t("importSentences")}</Typography>
          <IconButton onClick={onClose} size="small" aria-label={t("close")}>
            ✕
          </IconButton>
        </Stack>

        {/* Textarea */}
        <TextField
          label={t("pasteSentencesHere")}
          multiline
          minRows={6}
          maxRows={12}
          fullWidth
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder={"I go to the store | Я иду в магазин\nHe works every day | Он работает каждый день"}
          slotProps={{
            input: { sx: { overflowY: "auto" } },
          }}
        />

        {/* Pair separator */}
        <Stack spacing={1}>
          <Typography variant="body2" color="text.secondary">
            {t("separatorSourceTarget")}
          </Typography>
          <Select
            value={pairSep}
            onChange={(e) => setPairSep(e.target.value as PairSep)}
            size="small"
            fullWidth
          >
            <MenuItem value="pipe">{t("pipe")}</MenuItem>
            <MenuItem value="dash">{t("dash")}</MenuItem>
            <MenuItem value="custom">{tCommon("custom")}</MenuItem>
          </Select>
          {pairSep === "custom" && (
            <TextField
              size="small"
              placeholder={tCommon("enterSeparator")}
              value={customPairSep}
              onChange={(e) => setCustomPairSep(e.target.value)}
              fullWidth
            />
          )}
        </Stack>

        {/* Item separator */}
        <Stack spacing={1}>
          <Typography variant="body2" color="text.secondary">
            {t("separatorBetweenSentences")}
          </Typography>
          <Select
            value={itemSep}
            onChange={(e) => setItemSep(e.target.value as ItemSep)}
            size="small"
            fullWidth
          >
            <MenuItem value="newline">{tCommon("newLine")}</MenuItem>
            <MenuItem value="semicolon">{tCommon("semicolon")}</MenuItem>
            <MenuItem value="custom">{tCommon("custom")}</MenuItem>
          </Select>
          {itemSep === "custom" && (
            <TextField
              size="small"
              placeholder={tCommon("enterSeparator")}
              value={customItemSep}
              onChange={(e) => setCustomItemSep(e.target.value)}
              fullWidth
            />
          )}
        </Stack>

        {/* Format hint */}
        <Card variant="outlined">
          <CardContent sx={{ py: 1.5 }}>
            <Stack spacing={0.5}>
              <Typography variant="caption" color="text.secondary">
                {t("formatHint", { sep: resolvedPairSep.trim() || "—" })}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ whiteSpace: "pre-line" }}
              >
                {`Example:\nI go to the store${resolvedPairSep}Я иду в магазин`}
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        {/* Preview */}
        <Stack spacing={1}>
          <Typography variant="body2" color="text.secondary">
            {t("previewSentences", { count: parsed.length })}
          </Typography>
          {parsed.length === 0 ? (
            <Typography variant="caption" color="text.secondary">
              {t("noValidSentences")}
            </Typography>
          ) : (
            <Stack
              spacing={0}
              divider={<Divider />}
              sx={{ maxHeight: 200, overflowY: "auto" }}
            >
              {parsed.map((s) => (
                <Stack key={s.id} spacing={0.25} sx={{ py: 0.75 }}>
                  <Typography variant="body2">{s.sourceText}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {s.targetText}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          )}
        </Stack>

        {/* Spacer */}
        <Stack sx={{ flex: 1 }} />

        {/* Footer */}
        <Button
          variant="contained"
          fullWidth
          disabled={parsed.length === 0}
          onClick={handleImport}
        >
          {parsed.length > 0 ? t("importSentencesCount", { count: parsed.length }) : t("importSentencesFallback")}
        </Button>
      </Stack>
    </Drawer>
  );
}
