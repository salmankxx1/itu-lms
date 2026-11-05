import { Alert, Box, CircularProgress } from "@mui/material";

import CourseCards from "../components/CourseCards";
import PageHeader from "../components/PageHeader";
import { useApi } from "../services/useApi";

function MyCourses() {
  const { data, error, loading } = useApi("/me/overview");

  const isTeacher = data?.role === "teacher";

  return (
    <>
      <PageHeader title="My Courses" />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading && !data ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <CourseCards
          courses={data?.courses ?? []}
          emptyText={
            isTeacher
              ? "No courses are assigned to you yet."
              : "You are not enrolled in any courses yet. The administration will enroll you."
          }
        />
      )}
    </>
  );
}

export default MyCourses;
