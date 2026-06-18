"use client";

import { Button, Container, Stack, TextField, Typography } from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createCharacteristicAction } from "@/entities/characteristic/api/characteristic-actions";

export default function NewCharacteristicPage() {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [example, setExample] = useState("");
  const [loading, setLoading] = useState(false);

  const canSave = key.trim().length > 0 && description.trim().length > 0;

  async function handleSave() {
    if (!canSave || loading) return;
    setLoading(true);
    try {
      await createCharacteristicAction({
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
        <Typography variant="h1">New characteristic</Typography>
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
