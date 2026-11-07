import { Link } from "react-router-dom";
import { Alert, Box, Button, CircularProgress } from "@mui/material";

import CourseCards from "../components/CourseCards";
import PageHeader from "../components/PageHeader";
import { useApi } from "../services/useApi";

function MyCourses() {
  const { data, error, loading } = useApi("/me/overview");

  const isTeacher = data?.role === "teacher";

  return (
    <>
      <PageHeader
        title="My Courses"
        action={
          localStorage.getItem("role") === "student" && (
            <Button component={Link} to="/catalog" variant="contained">
              Browse courses
            </Button>
          )
        }
      />

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
              : "You are not enrolled in any courses yet. Use Browse Courses to request one."
          }
        />
      )}
    </>
  );
}

export default MyCourses;
