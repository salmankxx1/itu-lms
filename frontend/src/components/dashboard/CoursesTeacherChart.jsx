import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

function CoursesTeacherChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />

        <XAxis dataKey="teacher" tick={{ fill: "currentColor" }} />

        <YAxis allowDecimals={false} tick={{ fill: "currentColor" }} />

        <Tooltip />

        <Bar dataKey="courses" fill="#2e7d32" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default CoursesTeacherChart;
