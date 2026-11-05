import { Alert } from "@mui/material";

import { AnnouncementComposer, AnnouncementList } from "../components/AnnouncementFeed";
import PageHeader from "../components/PageHeader";
import { useApi } from "../services/useApi";

function Announcements() {
  const { data, error, reload } = useApi("/announcements");

  const isAdmin = localStorage.getItem("role") === "admin";

  return (
    <>
      <PageHeader title="Announcements" subtitle="Campus-wide news and updates from your courses" />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {isAdmin && <AnnouncementComposer onPosted={reload} />}

      {data && <AnnouncementList announcements={data} onChanged={reload} />}
    </>
  );
}

export default Announcements;
