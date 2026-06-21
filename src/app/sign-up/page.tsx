"use client";

import { Alert, Box, Button, Stack, TextField, Typography } from "@mui/material";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useFormStatus } from "react-dom";
import { signUp } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="contained" fullWidth disabled={pending}>
      {pending ? "Creating account…" : "Create account"}
    </Button>
  );
}

export default function SignUpPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <Box display="flex" alignItems="flex-start" justifyContent="center" minHeight="calc(100vh - 64px)" pt="15vh">
      <Stack spacing={3} width={320}>
        <Typography variant="h1">Sign up</Typography>

        {error && <Alert severity="error">{error}</Alert>}

        <form action={signUp}>
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
          Already have an account?{" "}
          <Link href="/sign-in" style={{ color: "inherit" }}>
            Sign in
          </Link>
        </Typography>
      </Stack>
    </Box>
  );
}
