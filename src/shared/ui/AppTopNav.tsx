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
import Link from "next/link";
import { useState } from "react";
import { signOut } from "@/app/sign-in/actions";

const NAV_LINKS = [
  { href: "/courses", label: "Courses" },
  { href: "/lists", label: "Lists" },
  { href: "/patterns", label: "Patterns" },
  { href: "/characteristics", label: "Characteristics" },
];

export function AppTopNav() {
  const [drawerOpen, setDrawerOpen] = useState(false);

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
        <Box sx={{ flex: 1, display: { xs: "none", sm: "flex" }, gap: 0.5, alignItems: "center" }}>
          {NAV_LINKS.map(({ href, label }) => (
            <Button key={href} component={Link} href={href} color="inherit">
              {label}
            </Button>
          ))}
          <Box sx={{ flex: 1 }} />
          <form action={signOut}>
            <Button type="submit" color="inherit" size="small">
              Logout
            </Button>
          </form>
        </Box>

        {/* Mobile hamburger */}
        <Box sx={{ flex: 1, display: { xs: "flex", sm: "none" }, justifyContent: "flex-end" }}>
          <IconButton onClick={() => setDrawerOpen(true)} color="inherit" aria-label="Menu">
            ☰
          </IconButton>
        </Box>
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
                <ListItemText primary="Logout" />
              </ListItemButton>
            </form>
          </ListItem>
        </List>
      </Drawer>
    </AppBar>
  );
}
