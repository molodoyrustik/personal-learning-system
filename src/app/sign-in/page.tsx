"use client";

import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { signIn } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="contained" fullWidth disabled={pending}>
      {pending ? "Signing in…" : "Sign in"}
    </Button>
  );
}

export default function SignInPage() {
  return (
    <Box
      display="flex"
      alignItems="flex-start"
      justifyContent="center"
      minHeight="calc(100vh - 64px)"
      pt="15vh"
    >
      <Stack spacing={3} width={320}>
        <Typography variant="h1">Sign in</Typography>

        <form action={signIn}>
          <Stack spacing={2}>
            <TextField
              name="email"
              label="Email"
              type="email"
              required
              fullWidth
              size="small"
            />
            <TextField
              name="password"
              label="Password"
              type="password"
              required
              fullWidth
              size="small"
            />
            <SubmitButton />
          </Stack>
        </form>

        <Typography variant="body2" color="text.secondary" textAlign="center">
          Don't have an account?{" "}
          <Link href="/sign-up" style={{ color: "inherit" }}>
            Sign up
          </Link>
        </Typography>
      </Stack>
    </Box>
  );
}
