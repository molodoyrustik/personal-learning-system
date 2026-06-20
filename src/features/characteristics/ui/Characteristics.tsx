"use client";

import {
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Drawer,
  IconButton,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { Characteristic } from "@/entities/characteristic";
import {
  createCharacteristicAction,
  createCharacteristicsAction,
  deleteCharacteristicAction,
} from "@/entities/characteristic/api/characteristic-actions";

type ItemSep = "newline" | "comma" | "semicolon" | "custom";

function resolveItemSep(itemSep: ItemSep, custom: string): string {
  if (itemSep === "newline") return "\n";
  if (itemSep === "comma") return ",";
  if (itemSep === "semicolon") return ";";
  return custom;
}

function parseImportKeys(raw: string, itemSep: string, existingKeys: Set<string>): string[] {
  if (!itemSep) return [];
  const parts = raw.split(itemSep);
  const seen = new Set<string>();
  const result: string[] = [];
  for (const part of parts) {
    const k = part.trim();
    if (!k || seen.has(k) || existingKeys.has(k)) continue;
    seen.add(k);
    result.push(k);
  }
  return result;
}

type CharacteristicsProps = {
  characteristics: Characteristic[];
};

export function Characteristics({ characteristics }: CharacteristicsProps) {
  const router = useRouter();
  const t = useTranslations("Characteristics");
  const tCommon = useTranslations("Common");

  const [quickKey, setQuickKey] = useState("");
  const [quickDescription, setQuickDescription] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [raw, setRaw] = useState("");
  const [itemSep, setItemSep] = useState<ItemSep>("newline");
  const [customItemSep, setCustomItemSep] = useState("");

  const existingKeySet = useMemo(
    () => new Set(characteristics.map((c) => c.key)),
    [characteristics],
  );

  const resolvedItemSep = resolveItemSep(itemSep, customItemSep);
  const previewKeys = useMemo(
    () => parseImportKeys(raw, resolvedItemSep, existingKeySet),
    [raw, resolvedItemSep, existingKeySet],
  );

  const canImport =
    previewKeys.length > 0 && (itemSep !== "custom" || customItemSep.trim().length > 0);

  const canQuickAdd = quickKey.trim().length > 0 && quickDescription.trim().length > 0 && !existingKeySet.has(quickKey.trim());

  async function handleQuickAdd() {
    if (!canQuickAdd) return;
    await createCharacteristicAction({ key: quickKey.trim(), description: quickDescription.trim(), example: null });
    setQuickKey("");
    setQuickDescription("");
    router.refresh();
  }

  async function handleBulkImport() {
    if (!canImport) return;
    await createCharacteristicsAction(previewKeys);
    setRaw("");
    setDrawerOpen(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    await deleteCharacteristicAction(id);
    router.refresh();
  }

  return (
    <Container sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          gap={1}
        >
          <Typography variant="h1">{t("title")}</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button variant="outlined" onClick={() => setDrawerOpen(true)}>
              {t("import")}
            </Button>
            <Button component={Link} href="/characteristics/new" variant="contained">
              {t("addCharacteristic")}
            </Button>
          </Stack>
        </Stack>

        <Card variant="outlined">
          <CardContent>
            <Stack spacing={1.5}>
              <Typography variant="body2" color="text.secondary">
                {t("quickAdd")}
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="flex-start">
                <TextField
                  label={t("key")}
                  size="small"
                  value={quickKey}
                  onChange={(e) => setQuickKey(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleQuickAdd()}
                  sx={{ width: 140, flexShrink: 0 }}
                />
                <TextField
                  label={t("description")}
                  size="small"
                  fullWidth
                  value={quickDescription}
                  onChange={(e) => setQuickDescription(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleQuickAdd()}
                />
                <Button
                  variant="contained"
                  onClick={handleQuickAdd}
                  disabled={!canQuickAdd}
                  sx={{ flexShrink: 0 }}
                >
                  {tCommon("add")}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {characteristics.length === 0 ? (
          <Typography variant="body1" color="text.secondary">
            {t("noCharacteristicsYet")}
          </Typography>
        ) : (
          <Stack spacing={2}>
            {characteristics.map((c) => (
              <Card key={c.id}>
                <CardContent>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", sm: "flex-start" }}
                    gap={2}
                  >
                    <Stack spacing={1}>
                      <Typography variant="h3">{c.key}</Typography>
                      {c.description && (
                        <Typography variant="body1">{c.description}</Typography>
                      )}
                      {c.example && (
                        <Typography variant="body2" color="text.secondary">
                          {c.example}
                        </Typography>
                      )}
                    </Stack>
                    <Stack direction="row" spacing={1} flexShrink={0}>
                      <Button
                        component={Link}
                        href={`/characteristics/${c.id}/edit`}
                        size="small"
                        variant="outlined"
                      >
                        {tCommon("edit")}
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        onClick={() => handleDelete(c.id)}
                      >
                        {tCommon("delete")}
                      </Button>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </Stack>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: "100%", sm: 420 }, p: 3 } }}
      >
        <Stack spacing={3} sx={{ height: "100%", overflowY: "auto" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h2">{t("addCharacteristicsBtn")}</Typography>
            <IconButton size="small" onClick={() => setDrawerOpen(false)} aria-label="Close">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>

          <TextField
            label={t("pasteKeys")}
            multiline
            minRows={6}
            fullWidth
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder={"in\nout\non\noff"}
          />

          <Stack spacing={1}>
            <Typography variant="body2" color="text.secondary">
              {t("separatorBetweenItems")}
            </Typography>
            <Select
              value={itemSep}
              onChange={(e) => setItemSep(e.target.value as ItemSep)}
              size="small"
              fullWidth
            >
              <MenuItem value="newline">{tCommon("newLine")}</MenuItem>
              <MenuItem value="comma">{t("comma")}</MenuItem>
              <MenuItem value="semicolon">{t("semicolon")}</MenuItem>
              <MenuItem value="custom">{tCommon("custom")}</MenuItem>
            </Select>
            {itemSep === "custom" && (
              <TextField
                size="small"
                placeholder={t("separator")}
                value={customItemSep}
                onChange={(e) => setCustomItemSep(e.target.value)}
                fullWidth
              />
            )}
          </Stack>

          <Stack spacing={1}>
            <Typography variant="body2" color="text.secondary">
              {t("pasteKeys")} ({previewKeys.length})
            </Typography>
            {previewKeys.length === 0 ? (
              <Typography variant="caption" color="text.secondary">
                {t("noNewKeys")}
              </Typography>
            ) : (
              <Stack
                spacing={0}
                divider={<Divider />}
                sx={{ maxHeight: 200, overflowY: "auto" }}
              >
                {previewKeys.map((k) => (
                  <Typography key={k} variant="body2" sx={{ py: 0.75 }}>
                    {k}
                  </Typography>
                ))}
              </Stack>
            )}
          </Stack>

          <Stack sx={{ flex: 1 }} />

          <Button variant="contained" fullWidth disabled={!canImport} onClick={handleBulkImport}>
            {t("addCharacteristicsBtn")}
          </Button>
        </Stack>
      </Drawer>
    </Container>
  );
}
