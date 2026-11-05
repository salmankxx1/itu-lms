import { Link } from "react-router-dom";
import { Box, Card, CardContent, Chip, Paper, Stack, Typography } from "@mui/material";

import { formatDateTime } from "../services/format";

export function MetricCard({ label, value, note, color = "text.primary" }) {
  return (
    <Card className="galaxy-glass-card" sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        <Typography variant="h4" sx={{ color }}>{value}</Typography>
        {note && <Typography variant="caption" color="text.secondary">{note}</Typography>}
      </CardContent>
    </Card>
  );
}

export function WelcomeBanner({ overline, name, detail, gradient }) {
  return (
    <Box
      sx={{
        p: { xs: 2.5, md: 3 },
        mb: 3,
        borderRadius: "16px",
        background: gradient,
        color: "#fff",
      }}
    >
      <Typography variant="overline" sx={{ letterSpacing: 1.2, opacity: 0.9, lineHeight: 1.4, display: "block" }}>
        {overline}
      </Typography>
      <Typography variant="h4" sx={{ fontWeight: "bold", overflowWrap: "anywhere" }}>
        Welcome, {name}
      </Typography>
      <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5, overflowWrap: "anywhere" }}>
        {detail}
      </Typography>
    </Box>
  );
}

export function UpcomingList({ items, showSubmitted }) {
  if (items.length === 0) {
    return <Typography color="text.secondary">Nothing is due soon.</Typography>;
  }

  return (
    <Stack spacing={1}>
      {items.map((item) => (
        <Paper
          key={item.id}
          variant="outlined"
          component={Link}
          to={`/courses/${item.course_id}`}
          sx={{ p: 1.5, textDecoration: "none", display: "block" }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.title}</Typography>
            {showSubmitted && item.submitted && <Chip size="small" color="success" label="Done" />}
          </Box>
          <Typography variant="caption" color="text.secondary">
            {item.course_code} • Due {formatDateTime(item.due_date)}
          </Typography>
        </Paper>
      ))}
    </Stack>
  );
}
