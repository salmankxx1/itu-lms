import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

function StudentsTeacherChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />

        <XAxis dataKey="teacher" tick={{ fill: "currentColor" }} />

        <YAxis allowDecimals={false} tick={{ fill: "currentColor" }} />

        <Tooltip />

        <Bar dataKey="students" fill="#1976d2" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default StudentsTeacherChart;
