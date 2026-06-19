import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import Link from "next/link";
import { signIn } from "./actions";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function SignInPage({ searchParams }: Props) {
  const { error } = await searchParams;

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
    >
      <Stack spacing={3} width={320}>
        <Typography variant="h1">Personal Learning System</Typography>

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
            {error && (
              <Typography variant="body2" color="error">
                {error}
              </Typography>
            )}
            <Button type="submit" variant="contained" fullWidth>
              Sign in
            </Button>
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
