"use client";

import {
  Button,
  Card,
  CardContent,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  ImportSentencesDrawer,
  type ImportedSentence,
} from "@/features/import-sentences";
import { createPatternWithSentences } from "@/entities/pattern/api/pattern-actions";
import { addPatternToLessonAction } from "@/entities/lesson/api/lesson-actions";
import { generateId } from "@/shared/lib/ids";

type PreviewSentence = { id: string; sourceText: string; targetText: string };

function deduplicateSentences(
  existing: PreviewSentence[],
  incoming: ImportedSentence[],
): PreviewSentence[] {
  const keys = new Set(existing.map((s) => `${s.sourceText}||${s.targetText}`));
  return incoming.filter((s) => !keys.has(`${s.sourceText}||${s.targetText}`));
}

type AddNewPatternProps = {
  lessonId?: string;
  courseId?: string;
};

export function AddNewPattern({ lessonId, courseId }: AddNewPatternProps = {}) {
  const router = useRouter();
  const t = useTranslations("Patterns");
  const tCommon = useTranslations("Common");
  const fromLesson = !!(lessonId && courseId);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [manualSource, setManualSource] = useState("");
  const [manualTarget, setManualTarget] = useState("");
  const sourceInputRef = useRef<HTMLInputElement>(null);
  const [sentences, setSentences] = useState<PreviewSentence[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const canCreate = name.trim().length > 0 && sentences.length > 0;

  function handleAddSentence() {
    const sourceText = manualSource.trim();
    const targetText = manualTarget.trim();
    if (!sourceText || !targetText) return;
    const isDuplicate = sentences.some(
      (s) => s.sourceText === sourceText && s.targetText === targetText,
    );
    if (!isDuplicate) {
      setSentences((prev) => [...prev, { id: generateId(), sourceText, targetText }]);
    }
    setManualSource("");
    setManualTarget("");
    sourceInputRef.current?.focus();
  }

  function handleRemoveSentence(id: string) {
    setSentences((prev) => prev.filter((s) => s.id !== id));
  }

  function handleImport(imported: ImportedSentence[]) {
    const unique = deduplicateSentences(sentences, imported);
    setSentences((prev) => [...prev, ...unique]);
    setDrawerOpen(false);
  }

  async function handleCreate() {
    if (!canCreate || loading) return;
    setLoading(true);
    try {
      const { patternId } = await createPatternWithSentences({
        name: name.trim(),
        description: description.trim() || null,
        sentences: sentences.map(({ sourceText, targetText }) => ({ sourceText, targetText })),
      });
      if (fromLesson) {
        await addPatternToLessonAction(lessonId!, patternId, courseId!);
        router.refresh();
        router.push(`/courses/${courseId}/lessons/${lessonId}`);
      } else {
        router.push(`/patterns/${patternId}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "32px 0" }}>
      <Stack spacing={3}>
        <Stack spacing={0.5}>
          <Button
            variant="text"
            size="small"
            sx={{ px: 0, minHeight: "auto" }}
            onClick={() =>
              fromLesson
                ? router.push(`/courses/${courseId}/lessons/${lessonId}`)
                : router.push("/patterns")
            }
          >
            {fromLesson ? t("backToLesson") : t("backToPatterns")}
          </Button>
          <Typography variant="h1">{t("newPattern")}</Typography>
        </Stack>

        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h3">{t("patternInfo")}</Typography>
              <TextField
                label={t("patternName")}
                placeholder={t("patternNamePlaceholder")}
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
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h3">{t("sentencesSection")}</Typography>
                <Button variant="outlined" size="small" onClick={() => setDrawerOpen(true)}>
                  {t("importSentences")}
                </Button>
              </Stack>
              <Stack spacing={1}>
                <TextField
                  inputRef={sourceInputRef}
                  label={t("sourceSentence")}
                  placeholder={t("sourceSentencePlaceholder")}
                  size="small"
                  fullWidth
                  value={manualSource}
                  onChange={(e) => setManualSource(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddSentence()}
                />
                <Stack direction="row" spacing={1}>
                  <TextField
                    label={t("englishSentence")}
                    placeholder={t("sourceSentencePlaceholder")}
                    size="small"
                    fullWidth
                    value={manualTarget}
                    onChange={(e) => setManualTarget(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddSentence()}
                  />
                  <Button
                    variant="contained"
                    onClick={handleAddSentence}
                    disabled={!manualSource.trim() || !manualTarget.trim()}
                    sx={{ flexShrink: 0 }}
                  >
                    {tCommon("add")}
                  </Button>
                </Stack>
              </Stack>
              {sentences.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  {t("noSentencesAdd")}
                </Typography>
              ) : (
                <>
                  <Divider />
                  <Stack spacing={0} divider={<Divider />}>
                    {sentences.map((s) => (
                      <Stack
                        key={s.id}
                        direction="row"
                        justifyContent="space-between"
                        alignItems="flex-start"
                        sx={{ py: 1 }}
                        gap={1}
                      >
                        <Stack spacing={0.25} sx={{ flex: 1 }}>
                          <Typography variant="body1">{s.sourceText}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {s.targetText}
                          </Typography>
                        </Stack>
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveSentence(s.id)}
                          aria-label={tCommon("remove")}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    ))}
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    {t("sentenceAdded", { count: sentences.length })}
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
          {loading ? tCommon("creating") : t("newPattern")}
        </Button>
      </Stack>

      <ImportSentencesDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onImport={handleImport}
      />
    </div>
  );
}
