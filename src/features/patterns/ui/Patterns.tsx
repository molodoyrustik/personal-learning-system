"use client";

import {
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";
import type { Pattern } from "@/entities/pattern";

type PatternsProps = {
  patterns: Pattern[];
  sentenceCounts: Record<string, number>;
};

export function Patterns({ patterns, sentenceCounts }: PatternsProps) {
  return (
    <Container sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h1">Patterns</Typography>
          <Button component={Link} href="/patterns/new" variant="contained">
            New pattern
          </Button>
        </Stack>

        {patterns.length === 0 ? (
          <Typography variant="body1" color="text.secondary">
            No patterns yet. Create one to start practicing grammar.
          </Typography>
        ) : (
          <Stack spacing={2}>
            {patterns.map((pattern) => {
              const count = sentenceCounts[pattern.id] ?? 0;
              return (
                <Card key={pattern.id}>
                  <CardActionArea component={Link} href={`/patterns/${pattern.id}`}>
                    <CardContent>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        gap={2}
                      >
                        <Stack spacing={0.5}>
                          <Typography variant="h3">{pattern.name}</Typography>
                          {pattern.description && (
                            <Typography variant="body2" color="text.secondary">
                              {pattern.description}
                            </Typography>
                          )}
                        </Stack>
                        <Chip
                          label={`${count} ${count === 1 ? "sentence" : "sentences"}`}
                          size="small"
                          variant="outlined"
                        />
                      </Stack>
                    </CardContent>
                  </CardActionArea>
                </Card>
              );
            })}
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
