"use client";

import { Button, Container, Stack, TextField, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createCourseAction } from "@/entities/course/api/course-actions";

export function AddNewCourse() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    const t = title.trim();
    if (!t || loading) return;
    setLoading(true);
    try {
      const { courseId } = await createCourseAction({
        title: t,
        description: description.trim() || null,
      });
      router.push(`/courses/${courseId}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Button variant="text" onClick={() => router.push("/courses")} size="small">
            ← Courses
          </Button>
        </Stack>

        <Typography variant="h1">New course</Typography>

        <Stack spacing={2}>
          <TextField
            label="Title"
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
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
          {loading ? "Creating…" : "Create course"}
        </Button>
      </Stack>
    </Container>
  );
}
