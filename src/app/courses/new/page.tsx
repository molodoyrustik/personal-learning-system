import { Container } from "@mui/material";
import { AddNewCourse } from "@/features/add-new-course";

export default function NewCoursePage() {
  return (
    <Container sx={{ py: 4 }}>
      <AddNewCourse />
    </Container>
  );
}
