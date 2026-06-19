"use client";

import { Button, Container, Stack, TextField, Typography } from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Characteristic } from "@/entities/characteristic";
import { updateCharacteristicAction } from "@/entities/characteristic/api/characteristic-actions";

type EditCharacteristicFormProps = {
  item: Characteristic;
};

export function EditCharacteristicForm({ item }: EditCharacteristicFormProps) {
  const router = useRouter();
  const [key, setKey] = useState(item.key);
  const [description, setDescription] = useState(item.description);
  const [example, setExample] = useState(item.example ?? "");
  const [loading, setLoading] = useState(false);

  const canSave = key.trim().length > 0 && description.trim().length > 0;

  async function handleSave() {
    if (!canSave || loading) return;
    setLoading(true);
    try {
      await updateCharacteristicAction(item.id, {
        key: key.trim(),
        description: description.trim(),
        example: example.trim() || null,
      });
      router.refresh();
      router.push("/characteristics");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container sx={{ py: 4 }}>
      <Stack spacing={3} maxWidth={480}>
        <Typography variant="h1">Edit characteristic</Typography>
        <TextField
          label="Key"
          required
          fullWidth
          value={key}
          onChange={(e) => setKey(e.target.value)}
          autoFocus
        />
        <TextField
          label="Description"
          required
          fullWidth
          multiline
          minRows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <TextField
          label="Example"
          fullWidth
          multiline
          minRows={2}
          value={example}
          onChange={(e) => setExample(e.target.value)}
        />
        <Stack direction="row" spacing={2}>
          <Button variant="contained" onClick={handleSave} disabled={!canSave || loading}>
            {loading ? "Saving…" : "Save"}
          </Button>
          <Button component={Link} href="/characteristics">
            Cancel
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}
