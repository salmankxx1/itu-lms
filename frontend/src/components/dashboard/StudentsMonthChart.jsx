import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

function StudentsMonthChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />

        <XAxis dataKey="month" tick={{ fill: "currentColor" }} />

        <YAxis allowDecimals={false} tick={{ fill: "currentColor" }} />

        <Tooltip />

        <Line type="monotone" dataKey="students" stroke="#ed6c02" strokeWidth={3} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default StudentsMonthChart;
