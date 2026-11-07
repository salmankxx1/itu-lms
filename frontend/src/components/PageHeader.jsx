import { Box, Paper, Typography } from "@mui/material";

function PageHeader({ title, subtitle, action }) {
  return (
    <Paper
      elevation={3}
      sx={{
        p: { xs: 2, sm: 3 },
        mb: 3,
        borderRadius: "16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 2,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h4">{title}</Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>

      {action}
    </Paper>
  );
}

export default PageHeader;
