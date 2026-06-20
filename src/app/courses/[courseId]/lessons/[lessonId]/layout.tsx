import { Container, Stack } from "@mui/material";
import type { ReactNode } from "react";

type LessonLayoutProps = {
  children: ReactNode;
};

export default function LessonLayout({ children }: LessonLayoutProps) {
  return (
    <Container sx={{ pt: 1.5, pb: 4 }}>
      <Stack spacing={3}>{children}</Stack>
    </Container>
  );
}
