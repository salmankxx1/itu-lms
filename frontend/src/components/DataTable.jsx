import { DataGrid } from "@mui/x-data-grid";
import { Alert, Paper, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";

// Server-driven grid shared by Students, Teachers and Courses.
// Columns marked `phoneHidden` are dropped on small screens, and on a phone
// long text wraps onto a second line instead of being cut off.
function DataTable({ columns, table }) {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("sm"));

  const columnVisibilityModel = Object.fromEntries(
    columns
      .filter((column) => column.phoneHidden)
      .map((column) => [column.field, !isPhone])
  );

  return (
    <Paper
      elevation={3}
      sx={{ p: { xs: 0, sm: 3 }, borderRadius: "16px", overflow: "hidden" }}
    >
      {table.error && <Alert severity="error" sx={{ m: { xs: 1, sm: 0 }, mb: 2 }}>{table.error}</Alert>}

      <div style={{ width: "100%", overflowX: "auto" }}>
        <DataGrid
          getRowHeight={isPhone ? () => "auto" : undefined}
          sx={
            isPhone
              ? {
                  border: 0,
                  "& .MuiDataGrid-cell": { whiteSpace: "normal", lineHeight: 1.35, py: 1.25 },
                }
              : undefined
          }
          rows={table.rows}
          columns={columns}
          rowCount={table.total}
          loading={table.loading}
          paginationMode="server"
          sortingMode="server"
          paginationModel={table.paginationModel}
          onPaginationModelChange={table.setPaginationModel}
          sortModel={table.sortModel}
          onSortModelChange={table.setSortModel}
          columnVisibilityModel={columnVisibilityModel}
          pageSizeOptions={[5, 10, 20]}
          disableRowSelectionOnClick
          autoHeight
        />
      </div>
    </Paper>
  );
}

export default DataTable;
