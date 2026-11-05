import Dashboard from "./Dashboard";
import StudentPortal from "./StudentPortal";
import TeacherPortal from "./TeacherPortal";

export default function RoleDispatcher() {
  const role = (localStorage.getItem("role") || "admin").toLowerCase();

  if (role === "student") {
    return <StudentPortal />;
  }

  if (role === "teacher") {
    return <TeacherPortal />;
  }

  // Default to Admin Analytics Dashboard
  return <Dashboard />;
}
