import { Container, Stack } from "@mui/material";
import type { ReactNode } from "react";

type ListLayoutProps = {
  children: ReactNode;
};

export default function ListLayout({ children }: ListLayoutProps) {
  return (
    <Container sx={{ pt: 1.5, pb: 4 }}>
      <Stack spacing={3}>{children}</Stack>
    </Container>
  );
}
