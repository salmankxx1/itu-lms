import { GridActionsCellItem } from "@mui/x-data-grid";
import { Delete, Edit } from "@mui/icons-material";

import AccountCell from "./AccountCell";
import DataTable from "./DataTable";

function TeacherTable({ table, onEdit, onDelete }) {
  const columns = [
    { field: "id", headerName: "ID", width: 80, phoneHidden: true },
    { field: "name", headerName: "Name", flex: 1, minWidth: 100 },
    { field: "email", headerName: "Email", flex: 1.5, minWidth: 180, phoneHidden: true },
    { field: "subject", headerName: "Subject", flex: 1, minWidth: 120, phoneHidden: true },
    { field: "department", headerName: "Department", flex: 1, minWidth: 120, phoneHidden: true },
    {
      field: "account_status",
      headerName: "Account",
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <AccountCell
          person={params.row}
          resetPath={`/teachers/${params.row.id}/reset-login`}
          canManage
          onDone={table.reload}
        />
      ),
    },
    {
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
    },
  ];

  return <DataTable columns={columns} table={table} />;
}

export default TeacherTable;
