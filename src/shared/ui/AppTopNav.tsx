"use client";

import {
  AppBar,
  Box,
  Button,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { signOut } from "@/app/sign-in/actions";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function AppTopNav({ isAuthenticated }: { isAuthenticated: boolean }) {
  const t = useTranslations("Nav");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const NAV_LINKS = [
    { href: "/courses", label: t("courses") },
    { href: "/lists", label: t("lists") },
    { href: "/patterns", label: t("patterns") },
    { href: "/characteristics", label: t("characteristics") },
  ];

  return (
    <AppBar
      position="static"
      color="inherit"
      elevation={0}
      sx={{ borderBottom: 1, borderColor: "divider" }}
    >
      <Toolbar sx={{ gap: 1 }}>
        <Typography
          variant="h3"
          component={Link}
          href="/courses"
          sx={{ mr: 2, color: "text.primary", textDecoration: "none", fontWeight: 600 }}
        >
          PLS
        </Typography>

        {/* Desktop nav */}
        {isAuthenticated && (
          <Box sx={{ flex: 1, display: { xs: "none", sm: "flex" }, gap: 0.5, alignItems: "center" }}>
            {NAV_LINKS.map(({ href, label }) => (
              <Button key={href} component={Link} href={href} color="inherit">
                {label}
              </Button>
            ))}
            <Box sx={{ flex: 1 }} />
            <LanguageSwitcher />
            <form action={signOut}>
              <Button type="submit" color="inherit" size="small">
                {t("logout")}
              </Button>
            </form>
          </Box>
        )}

        {/* Mobile hamburger */}
        {isAuthenticated && (
          <Box sx={{ flex: 1, display: { xs: "flex", sm: "none" }, justifyContent: "flex-end", gap: 1, alignItems: "center" }}>
            <LanguageSwitcher />
            <IconButton onClick={() => setDrawerOpen(true)} color="inherit" aria-label={t("menu")}>
              <MenuIcon />
            </IconButton>
          </Box>
        )}
      </Toolbar>

      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <List sx={{ width: 220, pt: 2 }}>
          {NAV_LINKS.map(({ href, label }) => (
            <ListItem key={href} disablePadding>
              <ListItemButton
                component={Link}
                href={href}
                onClick={() => setDrawerOpen(false)}
              >
                <ListItemText primary={label} />
              </ListItemButton>
            </ListItem>
          ))}
          <ListItem disablePadding>
            <form action={signOut} style={{ width: "100%" }}>
              <ListItemButton type="submit" component="button" sx={{ width: "100%" }}>
                <ListItemText primary={t("logout")} />
              </ListItemButton>
            </form>
          </ListItem>
        </List>
      </Drawer>
    </AppBar>
  );
}
