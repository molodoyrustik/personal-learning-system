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
import type { Pattern } from "@/entities/pattern";
import {
  updatePatternAction,
  importSentencesAction,
} from "@/entities/pattern/api/pattern-actions";
import {
  ImportSentencesDrawer,
  type ImportedSentence,
} from "@/features/import-sentences";
import { generateId } from "@/shared/lib/ids";

type PreviewSentence = { id: string; sourceText: string; targetText: string };

function deduplicateSentences(
  existing: PreviewSentence[],
  incoming: ImportedSentence[],
): PreviewSentence[] {
  const keys = new Set(existing.map((s) => `${s.sourceText}||${s.targetText}`));
  return incoming.filter((s) => !keys.has(`${s.sourceText}||${s.targetText}`));
}

type EditPatternProps = {
  pattern: Pattern;
};

export function EditPattern({ pattern }: EditPatternProps) {
  const router = useRouter();
  const t = useTranslations("Patterns");
  const tCommon = useTranslations("Common");

  // Info section
  const [name, setName] = useState(pattern.name);
  const [description, setDescription] = useState(pattern.description ?? "");
  const [infoLoading, setInfoLoading] = useState(false);

  async function handleSaveInfo() {
    if (!name.trim() || infoLoading) return;
    setInfoLoading(true);
    try {
      await updatePatternAction(pattern.id, {
        name: name.trim(),
        description: description.trim() || null,
      });
    } finally {
      setInfoLoading(false);
    }
  }

  // Sentences section
  const [manualSource, setManualSource] = useState("");
  const [manualTarget, setManualTarget] = useState("");
  const sourceInputRef = useRef<HTMLInputElement>(null);
  const [sentences, setSentences] = useState<PreviewSentence[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sentencesLoading, setSentencesLoading] = useState(false);

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

  async function handleSaveSentences() {
    if (sentences.length === 0 || sentencesLoading) return;
    setSentencesLoading(true);
    try {
      await importSentencesAction(
        pattern.id,
        sentences.map(({ sourceText, targetText }) => ({ sourceText, targetText })),
      );
      setSentences([]);
    } finally {
      setSentencesLoading(false);
    }
  }

  return (
    <>
      <Stack spacing={0.5}>
        <Button
          variant="text"
          size="small"
          sx={{ px: 0, minHeight: "auto", alignSelf: "flex-start" }}
          onClick={() => router.push(`/patterns/${pattern.id}`)}
        >
          {t("backToPattern")}
        </Button>
        <Typography variant="h1">{t("editPatternHeading")}</Typography>
      </Stack>

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h3">{t("patternInfo")}</Typography>
            <TextField
              label={t("patternName")}
              placeholder={t("patternNamePlaceholder")}
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <TextField
              label={t("descriptionLabel")}
              placeholder={t("descriptionPlaceholder")}
              fullWidth
              multiline
              minRows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Button
              variant="contained"
              onClick={handleSaveInfo}
              disabled={!name.trim() || infoLoading}
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
              </>
            )}
            {sentences.length > 0 && (
              <Button
                variant="contained"
                onClick={handleSaveSentences}
                disabled={sentencesLoading}
                sx={{ alignSelf: "flex-start" }}
              >
                {sentencesLoading ? tCommon("saving") : `${tCommon("add")} ${sentences.length}`}
              </Button>
            )}
          </Stack>
        </CardContent>
      </Card>

      <ImportSentencesDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onImport={handleImport}
      />
    </>
  );
}
