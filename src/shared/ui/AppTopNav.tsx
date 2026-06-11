"use client";

import { AppBar, Box, Button, Toolbar, Typography } from "@mui/material";
import Link from "next/link";

export function AppTopNav() {
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
          href="/lists"
          sx={{
            mr: 2,
            color: "text.primary",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          PLS
        </Typography>
        <Box sx={{ flex: 1, display: "flex", gap: 0.5 }}>
          <Button component={Link} href="/lists" color="inherit">
            Lists
          </Button>
          <Button component={Link} href="/patterns" color="inherit">
            Patterns
          </Button>
          <Button component={Link} href="/characteristics" color="inherit">
            Characteristics
          </Button>
          <Button component={Link} href="/courses" color="inherit">
            Courses
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
