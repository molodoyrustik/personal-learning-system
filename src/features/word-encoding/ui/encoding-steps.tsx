"use client";

import {
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useTranslations } from "next-intl";
import type { Word } from "@/entities/word/model/types";
import { PronounceButton } from "@/shared/ui/PronounceButton";
import { StudyActionBar } from "@/shared/ui/StudyActionBar";

export function StepImageCheck({
  word,
  hint,
  onHasImage,
  onSkip,
}: {
  word: Word;
  hint?: string;
  onHasImage: () => void;
  onSkip: () => void;
}) {
  const t = useTranslations("WordModes");
  return (
    <>
      <Card>
        <CardContent>
          <Stack
            alignItems="center"
            justifyContent="center"
            sx={{ minHeight: 160, py: 2 }}
            spacing={2}
          >
            <Typography variant="h1" textAlign="center">
              {word.sourceText}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("visualizeIt")}
            </Typography>
            {hint && (
              <Typography variant="caption" color="text.secondary">
                {hint}
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>
      <StudyActionBar>
        <Stack direction="row" spacing={1}>
          <Button variant="text" fullWidth color="inherit" onClick={onSkip}>
            {t("skip")}
          </Button>
          <Button variant="contained" fullWidth onClick={onHasImage}>
            {t("gotIt")}
          </Button>
        </Stack>
      </StudyActionBar>
    </>
  );
}

export function StepSoundEncoding({
  word,
  value,
  targetLang,
  onChange,
  onNext,
  onSkip,
}: {
  word: Word;
  value: string;
  targetLang: string;
  onChange: (v: string) => void;
  onNext: () => void;
  onSkip: () => void;
}) {
  const t = useTranslations("WordModes");
  return (
    <>
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Stack spacing={0.5} alignItems="center">
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="h2" textAlign="center">
                  {word.targetText}
                </Typography>
                <PronounceButton text={word.targetText} lang={targetLang} />
              </Stack>
              <Typography
                variant="body2"
                color="text.secondary"
                textAlign="center"
              >
                {word.sourceText}
              </Typography>
            </Stack>
            <TextField
              label={t("soundAssociation")}
              placeholder={t("enterAssociation")}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onNext()}
              fullWidth
            />
          </Stack>
        </CardContent>
      </Card>
      <StudyActionBar>
        <Stack direction="row" spacing={1}>
          <Button variant="text" fullWidth color="inherit" onClick={onSkip}>
            {t("skip")}
          </Button>
          <Button variant="contained" fullWidth onClick={onNext}>
            {t("next")}
          </Button>
        </Stack>
      </StudyActionBar>
    </>
  );
}

export function StepSceneCreation({
  value,
  onChange,
  onSave,
  onSkip,
}: {
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  onSkip: () => void;
}) {
  const t = useTranslations("WordModes");
  return (
    <>
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
            >
              {t("connectImages")}
            </Typography>
            <TextField
              label={t("scene")}
              placeholder={t("describeScene")}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSave()}
              fullWidth
            />
          </Stack>
        </CardContent>
      </Card>
      <StudyActionBar>
        <Stack direction="row" spacing={1}>
          <Button variant="text" fullWidth color="inherit" onClick={onSkip}>
            {t("skip")}
          </Button>
          <Button variant="contained" fullWidth onClick={onSave}>
            {t("done2")}
          </Button>
        </Stack>
      </StudyActionBar>
    </>
  );
}

export function StepFixation({
  word,
  soundAssociation,
  sceneDescription,
  targetLang,
  onDone,
}: {
  word: Word;
  soundAssociation: string;
  sceneDescription: string;
  targetLang: string;
  onDone: () => void;
}) {
  const t = useTranslations("WordModes");
  return (
    <>
      <Card>
        <CardContent>
          <Stack spacing={2.5}>
            <Stack spacing={0.5} alignItems="center">
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="h2">{word.targetText}</Typography>
                <PronounceButton text={word.targetText} lang={targetLang} />
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {word.sourceText}
              </Typography>
            </Stack>
            {soundAssociation && (
              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary">
                  {t("association")}
                </Typography>
                <Typography variant="body1">{soundAssociation}</Typography>
              </Stack>
            )}
            {sceneDescription && (
              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary">
                  {t("scene")}
                </Typography>
                <Typography variant="body1">{sceneDescription}</Typography>
              </Stack>
            )}
            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
            >
              {t("lookAndSay")}
            </Typography>
          </Stack>
        </CardContent>
      </Card>
      <StudyActionBar>
        <Button variant="contained" fullWidth onClick={onDone}>
          {t("done")}
        </Button>
      </StudyActionBar>
    </>
  );
}
