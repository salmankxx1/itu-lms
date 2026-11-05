import Courses from "./Courses";
import MyCourses from "./MyCourses";

// Admins manage the whole catalog; teachers and students see their own courses
export default function CoursesRouter() {
  return localStorage.getItem("role") === "admin" ? <Courses /> : <MyCourses />;
}
