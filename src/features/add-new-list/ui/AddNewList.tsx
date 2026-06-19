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
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { LanguageCode } from "@/entities/list";
import { ImportDrawer, type ImportedWord } from "@/features/import-words";
import { createListWithWords } from "@/features/add-new-list/actions";
import { addWordListToLessonAction } from "@/entities/lesson/api/lesson-actions";
import { generateId } from "@/shared/lib/ids";

type PreviewWord = { id: string; sourceText: string; targetText: string };

const LANGUAGE_LABELS: Record<LanguageCode, string> = {
  ru: "Russian",
  en: "English",
};

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
            {fromLesson ? "← Back to lesson" : "← Back to Lists"}
          </Button>
          <Typography variant="h1">Create list</Typography>
        </Stack>

        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h3">List info</Typography>
              <TextField
                label="List name"
                placeholder="e.g. Travel Vocabulary"
                fullWidth
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
              <TextField
                label="Description (optional)"
                placeholder="What is this list about?"
                fullWidth
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                multiline
                minRows={2}
              />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <FormControl fullWidth size="small">
                  <InputLabel id="source-lang-label">Source language</InputLabel>
                  <Select
                    labelId="source-lang-label"
                    label="Source language"
                    value={sourceLanguage}
                    onChange={(e) => setSourceLanguage(e.target.value as LanguageCode)}
                  >
                    <MenuItem value="ru">Russian (ru)</MenuItem>
                    <MenuItem value="en">English (en)</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small">
                  <InputLabel id="target-lang-label">Target language</InputLabel>
                  <Select
                    labelId="target-lang-label"
                    label="Target language"
                    value={targetLanguage}
                    onChange={(e) => setTargetLanguage(e.target.value as LanguageCode)}
                  >
                    <MenuItem value="ru">Russian (ru)</MenuItem>
                    <MenuItem value="en">English (en)</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
              {!languagesValid && (
                <Typography variant="caption" color="text.secondary">
                  Source and target language must be different.
                </Typography>
              )}
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h3">Words</Typography>
                <Button variant="outlined" size="small" onClick={() => setDrawerOpen(true)}>
                  + Import
                </Button>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="flex-start">
                <TextField
                  inputRef={sourceInputRef}
                  label={`${LANGUAGE_LABELS[sourceLanguage]} word`}
                  placeholder="…"
                  size="small"
                  fullWidth
                  value={manualSourceText}
                  onChange={(e) => setManualSourceText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddWord()}
                />
                <TextField
                  label={`${LANGUAGE_LABELS[targetLanguage]} word`}
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
                  Add
                </Button>
              </Stack>
              {words.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No words yet. Add manually or import.
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
                          ✕
                        </IconButton>
                      </Stack>
                    ))}
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    {words.length} {words.length === 1 ? "word" : "words"} added
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
          {loading ? "Creating…" : "Create list"}
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
