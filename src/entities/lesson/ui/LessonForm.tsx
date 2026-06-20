"use client";

import { Button, Stack, TextField, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";

type LessonFormProps = {
  backHref: string;
  heading: string;
  submitLabel: string;
  initialTitle?: string;
  initialDescription?: string;
  onSubmit: (data: { title: string; description: string | null }) => Promise<void>;
};

export function LessonForm({
  backHref,
  heading,
  submitLabel,
  initialTitle = "",
  initialDescription = "",
  onSubmit,
}: LessonFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    const t = title.trim();
    if (!t || loading) return;
    setLoading(true);
    try {
      await onSubmit({ title: t, description: description.trim() || null });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Stack spacing={3} sx={{ maxWidth: 560 }}>
      <Button
        variant="text"
        onClick={() => router.push(backHref)}
        size="small"
        sx={{ alignSelf: "flex-start" }}
      >
        ←
      </Button>

      <Typography variant="h1">{heading}</Typography>

      <Stack spacing={2}>
        <TextField
          label="Title"
          fullWidth
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          autoFocus
        />
        <TextField
          label="Description (optional)"
          fullWidth
          multiline
          minRows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Stack>

      <Button
        variant="contained"
        onClick={handleSubmit}
        disabled={!title.trim() || loading}
        sx={{ alignSelf: "flex-start" }}
      >
        {loading ? `${submitLabel}…` : submitLabel}
      </Button>
    </Stack>
  );
}
