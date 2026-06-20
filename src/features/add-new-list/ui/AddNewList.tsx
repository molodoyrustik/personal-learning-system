"use client";

import {
  Button,
  Card,
  CardContent,
  Container,
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
import CloseIcon from "@mui/icons-material/Close";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { LanguageCode } from "@/entities/list";
import { ImportDrawer, type ImportedWord } from "@/features/import-words";
import { createListWithWords } from "@/features/add-new-list/actions";
import { addWordListToLessonAction } from "@/entities/lesson/api/lesson-actions";
import { generateId } from "@/shared/lib/ids";

type PreviewWord = { id: string; sourceText: string; targetText: string };

// LANGUAGE_LABELS built inside component using t()

function makePreviewWord(sourceText: string, targetText: string): PreviewWord {
  return { id: generateId(), sourceText, targetText };
}

function deduplicateWords(existing: PreviewWord[], incoming: ImportedWord[]): PreviewWord[] {
  const keys = new Set(existing.map((w) => `${w.sourceText}||${w.targetText}`));
  return incoming.filter((w) => !keys.has(`${w.sourceText}||${w.targetText}`));
}

type AddNewListProps = {
  lessonId?: string;
  courseId?: string;
};

export function AddNewList({ lessonId, courseId }: AddNewListProps = {}) {
  const router = useRouter();
  const t = useTranslations("Lists");
  const tCommon = useTranslations("Common");

  const LANGUAGE_LABELS: Record<LanguageCode, string> = {
    ru: t("russian"),
    en: t("english"),
  };

  const fromLesson = !!(lessonId && courseId);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState<LanguageCode>("ru");
  const [targetLanguage, setTargetLanguage] = useState<LanguageCode>("en");
  const [manualSourceText, setManualSourceText] = useState("");
  const [manualTargetText, setManualTargetText] = useState("");
  const sourceInputRef = useRef<HTMLInputElement>(null);
  const [words, setWords] = useState<PreviewWord[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const languagesValid = sourceLanguage !== targetLanguage;
  const canCreate = name.trim().length > 0 && words.length > 0 && languagesValid;

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

  async function handleCreate() {
    if (!canCreate || loading) return;
    setLoading(true);
    try {
      const { listId } = await createListWithWords({
        name: name.trim(),
        description: description.trim() || null,
        sourceLanguage,
        targetLanguage,
        words: words.map(({ sourceText, targetText }) => ({ sourceText, targetText })),
      });
      if (fromLesson) {
        await addWordListToLessonAction(lessonId!, listId, courseId!);
        router.refresh();
        router.push(`/courses/${courseId}/lessons/${lessonId}`);
      } else {
        router.push(`/lists/${listId}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Stack spacing={0.5}>
          <Button
            variant="text"
            size="small"
            sx={{ px: 0, minHeight: "auto" }}
            onClick={() =>
              fromLesson
                ? router.push(`/courses/${courseId}/lessons/${lessonId}`)
                : router.push("/lists")
            }
          >
            {fromLesson ? t("backToLesson") : t("backToLists")}
          </Button>
          <Typography variant="h1">{t("createList")}</Typography>
        </Stack>

        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h3">{t("listInfo")}</Typography>
              <TextField
                label={t("listName")}
                placeholder={t("listNamePlaceholder")}
                fullWidth
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
              <TextField
                label={t("descriptionLabel")}
                placeholder={t("descriptionPlaceholder")}
                fullWidth
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                multiline
                minRows={2}
              />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <FormControl fullWidth size="small">
                  <InputLabel id="source-lang-label">{t("sourceLanguage")}</InputLabel>
                  <Select
                    labelId="source-lang-label"
                    label={t("sourceLanguage")}
                    value={sourceLanguage}
                    onChange={(e) => setSourceLanguage(e.target.value as LanguageCode)}
                  >
                    <MenuItem value="ru">{t("russian")}</MenuItem>
                    <MenuItem value="en">{t("english")}</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small">
                  <InputLabel id="target-lang-label">{t("targetLanguage")}</InputLabel>
                  <Select
                    labelId="target-lang-label"
                    label={t("targetLanguage")}
                    value={targetLanguage}
                    onChange={(e) => setTargetLanguage(e.target.value as LanguageCode)}
                  >
                    <MenuItem value="ru">{t("russian")}</MenuItem>
                    <MenuItem value="en">{t("english")}</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
              {!languagesValid && (
                <Typography variant="caption" color="text.secondary">
                  {t("languageError")}
                </Typography>
              )}
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h3">{t("wordsSection")}</Typography>
                <Button variant="outlined" size="small" onClick={() => setDrawerOpen(true)}>
                  {t("importWords")}
                </Button>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="flex-start">
                <TextField
                  inputRef={sourceInputRef}
                  label={`${LANGUAGE_LABELS[sourceLanguage]}`}
                  placeholder="…"
                  size="small"
                  fullWidth
                  value={manualSourceText}
                  onChange={(e) => setManualSourceText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddWord()}
                />
                <TextField
                  label={`${LANGUAGE_LABELS[targetLanguage]}`}
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
                  sx={{ flexShrink: 0, whiteSpace: "nowrap" }}
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
                          aria-label={tCommon("remove")}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    ))}
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    {t("wordAdded", { count: words.length })}
                  </Typography>
                </>
              )}
            </Stack>
          </CardContent>
        </Card>

        <Button
          variant="contained"
          fullWidth
          disabled={!canCreate || loading}
          onClick={handleCreate}
        >
          {loading ? tCommon("creating") : t("createList")}
        </Button>
      </Stack>

      <ImportDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onImport={handleImport}
      />
    </Container>
  );
}
