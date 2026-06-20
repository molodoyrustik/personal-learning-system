"use client";

import {
  Button,
  Card,
  CardActionArea,
  CardContent,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { List } from "@/entities/list";

type ListsProps = {
  lists: List[];
  wordCountMap: Record<string, number>;
};

export function Lists({ lists, wordCountMap }: ListsProps) {
  const t = useTranslations("Lists");

  return (
    <Container sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="h1">{t("title")}</Typography>
          <Link href="/lists/new" style={{ textDecoration: "none" }}>
            <Button variant="contained">{t("createList")}</Button>
          </Link>
        </Stack>

        <Stack spacing={2}>
          {lists.length === 0 && (
            <Typography variant="body1" color="text.secondary">
              {t("noListsYet")}
            </Typography>
          )}
          {lists.map((list) => (
            <Link
              key={list.id}
              href={`/lists/${list.id}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <Card>
                <CardActionArea>
                  <CardContent>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="h3">{list.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {wordCountMap[list.id] ?? 0} {t("words")}
                      </Typography>
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Link>
          ))}
        </Stack>
      </Stack>
    </Container>
  );
}
