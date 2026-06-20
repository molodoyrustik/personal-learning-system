"use client";

import {
  Button,
  Card,
  CardContent,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { List, LanguageCode } from "@/entities/list";
import { ImportDrawer, type ImportedWord } from "@/features/import-words";
import CloseIcon from "@mui/icons-material/Close";
import { updateListAction, addWordsToListAction } from "@/features/add-new-list/actions";
import { generateId } from "@/shared/lib/ids";

type PreviewWord = { id: string; sourceText: string; targetText: string };

function makePreviewWord(sourceText: string, targetText: string): PreviewWord {
  return { id: generateId(), sourceText, targetText };
}

function deduplicateWords(existing: PreviewWord[], incoming: ImportedWord[]): PreviewWord[] {
  const keys = new Set(existing.map((w) => `${w.sourceText}||${w.targetText}`));
  return incoming.filter((w) => !keys.has(`${w.sourceText}||${w.targetText}`));
}

type EditListProps = {
  list: List;
};

export function EditList({ list }: EditListProps) {
  const router = useRouter();
  const t = useTranslations("Lists");
  const tCommon = useTranslations("Common");

  const LANGUAGE_LABELS: Record<LanguageCode, string> = {
    ru: t("russian"),
    en: t("english"),
  };

  // Info section
  const [name, setName] = useState(list.name);
  const [description, setDescription] = useState(list.description ?? "");
  const [sourceLanguage, setSourceLanguage] = useState<LanguageCode>(list.sourceLanguage);
  const [targetLanguage, setTargetLanguage] = useState<LanguageCode>(list.targetLanguage);
  const [infoLoading, setInfoLoading] = useState(false);
  const languageError = sourceLanguage === targetLanguage;

  async function handleSaveInfo() {
    if (!name.trim() || languageError || infoLoading) return;
    setInfoLoading(true);
    try {
      await updateListAction(list.id, {
        name: name.trim(),
        description: description.trim() || null,
        sourceLanguage,
        targetLanguage,
      });
    } finally {
      setInfoLoading(false);
    }
  }

  // Words section
  const [manualSourceText, setManualSourceText] = useState("");
  const [manualTargetText, setManualTargetText] = useState("");
  const sourceInputRef = useRef<HTMLInputElement>(null);
  const [words, setWords] = useState<PreviewWord[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [wordsLoading, setWordsLoading] = useState(false);

  function handleAddWord() {
    const sourceText = manualSourceText.trim();
    const targetText = manualTargetText.trim();
    if (!sourceText || !targetText) return;
    const isDuplicate = words.some(
      (w) => w.sourceText === sourceText && w.targetText === targetText,
    );
    if (!isDuplicate) {
      setWords((prev) => [...prev, makePreviewWord(sourceText, targetText)]);
    }
    setManualSourceText("");
    setManualTargetText("");
    sourceInputRef.current?.focus();
  }

  function handleRemoveWord(id: string) {
    setWords((prev) => prev.filter((w) => w.id !== id));
  }

  function handleImport(imported: ImportedWord[]) {
    const unique = deduplicateWords(words, imported);
    setWords((prev) => [...prev, ...unique]);
    setDrawerOpen(false);
  }

  async function handleSaveWords() {
    if (words.length === 0 || wordsLoading) return;
    setWordsLoading(true);
    try {
      await addWordsToListAction(
        list.id,
        words.map(({ sourceText, targetText }) => ({ sourceText, targetText })),
      );
      setWords([]);
    } finally {
      setWordsLoading(false);
    }
  }

  return (
    <>
      <Stack spacing={0.5}>
        <Button
          variant="text"
          size="small"
          sx={{ px: 0, minHeight: "auto", alignSelf: "flex-start" }}
          onClick={() => router.push(`/lists/${list.id}`)}
        >
          {t("backToLists")}
        </Button>
        <Typography variant="h1">{t("editListHeading")}</Typography>
      </Stack>

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h3">{t("listInfo")}</Typography>
            <TextField
              label={t("listName")}
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <TextField
              label={t("descriptionLabel")}
              fullWidth
              multiline
              minRows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <FormControl fullWidth>
              <InputLabel>{t("sourceLanguage")}</InputLabel>
              <Select
                value={sourceLanguage}
                label={t("sourceLanguage")}
                onChange={(e) => setSourceLanguage(e.target.value as LanguageCode)}
              >
                {(Object.keys(LANGUAGE_LABELS) as LanguageCode[]).map((code) => (
                  <MenuItem key={code} value={code}>{LANGUAGE_LABELS[code]}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>{t("targetLanguage")}</InputLabel>
              <Select
                value={targetLanguage}
                label={t("targetLanguage")}
                onChange={(e) => setTargetLanguage(e.target.value as LanguageCode)}
              >
                {(Object.keys(LANGUAGE_LABELS) as LanguageCode[]).map((code) => (
                  <MenuItem key={code} value={code}>{LANGUAGE_LABELS[code]}</MenuItem>
                ))}
              </Select>
            </FormControl>
            {languageError && (
              <Typography variant="body2" color="error">
                {t("languageError")}
              </Typography>
            )}
            <Button
              variant="contained"
              onClick={handleSaveInfo}
              disabled={!name.trim() || languageError || infoLoading}
              sx={{ alignSelf: "flex-start" }}
            >
              {infoLoading ? tCommon("saving") : tCommon("save")}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h3">{t("addWordsAction")}</Typography>
              <Button variant="outlined" size="small" onClick={() => setDrawerOpen(true)}>
                {t("importWords")}
              </Button>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <TextField
                inputRef={sourceInputRef}
                label={sourceLanguage.toUpperCase()}
                placeholder="…"
                size="small"
                fullWidth
                value={manualSourceText}
                onChange={(e) => setManualSourceText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddWord()}
              />
              <TextField
                label={targetLanguage.toUpperCase()}
                placeholder="…"
                size="small"
                fullWidth
                value={manualTargetText}
                onChange={(e) => setManualTargetText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddWord()}
              />
              <Button
                variant="contained"
                onClick={handleAddWord}
                disabled={!manualSourceText.trim() || !manualTargetText.trim()}
                sx={{ flexShrink: 0 }}
              >
                {tCommon("add")}
              </Button>
            </Stack>

            {words.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                {t("noWordsYet")}
              </Typography>
            ) : (
              <>
                <Divider />
                <Stack spacing={0} divider={<Divider />}>
                  {words.map((word) => (
                    <Stack
                      key={word.id}
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ py: 1 }}
                    >
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Typography variant="body1">{word.sourceText}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {word.targetText}
                        </Typography>
                      </Stack>
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveWord(word.id)}
                        aria-label="Remove word"
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  ))}
                </Stack>
              </>
            )}

            {words.length > 0 && (
              <Button
                variant="contained"
                onClick={handleSaveWords}
                disabled={wordsLoading}
                sx={{ alignSelf: "flex-start" }}
              >
                {wordsLoading ? tCommon("saving") : `${tCommon("add")} ${words.length}`}
              </Button>
            )}
          </Stack>
        </CardContent>
      </Card>

      <ImportDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onImport={handleImport}
      />
    </>
  );
}
