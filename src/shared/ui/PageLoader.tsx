import { CircularProgress, Stack } from "@mui/material";

// Route-level loading state: shown instantly on navigation while the next
// page's server data loads.
export function PageLoader() {
  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      sx={{ minHeight: "60vh" }}
    >
      <CircularProgress />
    </Stack>
  );
}
