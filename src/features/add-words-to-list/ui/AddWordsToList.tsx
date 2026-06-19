"use client";

import {
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { List } from "@/entities/list";
import { ImportDrawer, type ImportedWord } from "@/features/import-words";
import { addWordsToListAction } from "@/features/add-new-list/actions";
import { generateId } from "@/shared/lib/ids";

type PreviewWord = { id: string; sourceText: string; targetText: string };

function makePreviewWord(sourceText: string, targetText: string): PreviewWord {
  return { id: generateId(), sourceText, targetText };
}

function deduplicateWords(existing: PreviewWord[], incoming: ImportedWord[]): PreviewWord[] {
  const keys = new Set(existing.map((w) => `${w.sourceText}||${w.targetText}`));
  return incoming.filter((w) => !keys.has(`${w.sourceText}||${w.targetText}`));
}

type AddWordsToListProps = {
  list: List;
};

export function AddWordsToList({ list }: AddWordsToListProps) {
  const router = useRouter();
  const [manualSourceText, setManualSourceText] = useState("");
  const [manualTargetText, setManualTargetText] = useState("");
  const sourceInputRef = useRef<HTMLInputElement>(null);
  const [words, setWords] = useState<PreviewWord[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);

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

  async function handleSave() {
    if (words.length === 0 || loading) return;
    setLoading(true);
    try {
      await addWordsToListAction(
        list.id,
        words.map(({ sourceText, targetText }) => ({ sourceText, targetText })),
      );
      router.refresh();
      router.push(`/lists/${list.id}`);
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
            onClick={() => router.push(`/lists/${list.id}`)}
          >
            ← Back to list
          </Button>
          <Typography variant="h1">Add words</Typography>
          <Typography variant="body2" color="text.secondary">{list.name}</Typography>
        </Stack>

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
                  label={list.sourceLanguage.toUpperCase()}
                  placeholder="…"
                  size="small"
                  fullWidth
                  value={manualSourceText}
                  onChange={(e) => setManualSourceText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddWord()}
                  autoFocus
                />
                <TextField
                  label={list.targetLanguage.toUpperCase()}
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
                    {words.length} {words.length === 1 ? "word" : "words"} to add
                  </Typography>
                </>
              )}
            </Stack>
          </CardContent>
        </Card>

        <Button
          variant="contained"
          fullWidth
          disabled={words.length === 0 || loading}
          onClick={handleSave}
        >
          {loading ? "Saving…" : `Add ${words.length > 0 ? words.length : ""} words`}
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
