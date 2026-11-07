import { Paper, Typography, Box } from "@mui/material";

function DashboardCard({ title, value, icon }) {

  return (

    <Paper
      elevation={8}
      sx={{
        p: 4,
        borderRadius: "16px",
        transition: "0.3s",
        cursor: "pointer",
        "&:hover": {
          transform: "translateY(-5px)",
        },
      }}
    >

      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
      >

        <Box>

          <Typography
            variant="h6"
            color="text.secondary"
          >
            {title}
          </Typography>

          <Typography
            variant="h3" sx={{ fontWeight: "bold", mt: 2 }}>
            {value}
          </Typography>

        </Box>

        {icon}

      </Box>

    </Paper>

  );

}

export default DashboardCard;