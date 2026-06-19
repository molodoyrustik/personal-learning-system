import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import Link from "next/link";
import { signUp } from "./actions";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function SignUpPage({ searchParams }: Props) {
  const { error } = await searchParams;

  return (
    <Box display="flex" alignItems="center" justifyContent="center" minHeight="100vh">
      <Stack spacing={3} width={320}>
        <Typography variant="h1">Personal Learning System</Typography>

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
            {error && (
              <Typography variant="body2" color="error">
                {error}
              </Typography>
            )}
            <Button type="submit" variant="contained" fullWidth>
              Create account
            </Button>
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
