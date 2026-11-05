import { GridActionsCellItem } from "@mui/x-data-grid";
import { Delete, Edit } from "@mui/icons-material";

import AccountCell from "./AccountCell";
import DataTable from "./DataTable";

function StudentTable({ table, canManage, onEdit, onDelete }) {
  const columns = [
    { field: "id", headerName: "ID", width: 80, phoneHidden: true },
    { field: "name", headerName: "Name", flex: 1, minWidth: 100 },
    { field: "email", headerName: "Email", flex: 1.5, minWidth: 180, phoneHidden: true },
    { field: "age", headerName: "Age", width: 80, phoneHidden: true },
    { field: "gender", headerName: "Gender", width: 110, phoneHidden: true },
    {
      field: "teacher",
      headerName: "Teacher",
      flex: 1,
      minWidth: 130,
      phoneHidden: true,
      valueGetter: (_, row) => row.teacher?.name || "Not Assigned",
    },
    {
      field: "account_status",
      headerName: "Account",
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <AccountCell
          person={params.row}
          resetPath={`/students/${params.row.id}/reset-login`}
          canManage={canManage}
          onDone={table.reload}
        />
      ),
    },
  ];

  if (canManage) {
    columns.push({
      field: "actions",
      type: "actions",
      width: 80,
      getActions: (params) => [
        <GridActionsCellItem
          key="edit"
          icon={<Edit />}
          label="Edit"
          onClick={() => onEdit(params.row)}
        />,
        <GridActionsCellItem
          key="delete"
          icon={<Delete />}
          label="Delete"
          onClick={() => onDelete(params.row)}
        />,
      ],
    });
  }

  return <DataTable columns={columns} table={table} />;
}

export default StudentTable;
