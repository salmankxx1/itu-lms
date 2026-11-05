import { GridActionsCellItem } from "@mui/x-data-grid";
import { Delete, Edit, OpenInNew } from "@mui/icons-material";

import DataTable from "./DataTable";

function CourseTable({ table, onOpen, onEdit, onDelete }) {
  const columns = [
    { field: "id", headerName: "ID", width: 80, phoneHidden: true },
    { field: "name", headerName: "Course", flex: 1, minWidth: 110 },
    { field: "code", headerName: "Code", width: 90 },
    { field: "credit_hours", headerName: "Credit Hours", width: 120, phoneHidden: true },
    {
      field: "teacher",
      headerName: "Teacher",
      flex: 1,
      minWidth: 130,
      phoneHidden: true,
      valueGetter: (_, row) => row.teacher?.name || "Not Assigned",
    },
    {
      field: "actions",
      headerName: "Actions",
      type: "actions",
      width: 120,
      getActions: (params) => [
        <GridActionsCellItem
          key="open"
          icon={<OpenInNew />}
          label="Open course"
          onClick={() => onOpen(params.row)}
        />,
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

export default CourseTable;
