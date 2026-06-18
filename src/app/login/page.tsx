import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import { signIn } from "./actions";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
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
      </Stack>
    </Box>
  );
}
