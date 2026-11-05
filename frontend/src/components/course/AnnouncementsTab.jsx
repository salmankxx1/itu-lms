import { useMemo } from "react";
import { Alert } from "@mui/material";

import { AnnouncementComposer, AnnouncementList } from "../AnnouncementFeed";
import { useApi } from "../../services/useApi";

function AnnouncementsTab({ courseId, canManage }) {
  const params = useMemo(() => ({ course_id: courseId }), [courseId]);
  const { data, error, reload } = useApi("/announcements", params);

  return (
    <>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {canManage && <AnnouncementComposer courseId={courseId} onPosted={reload} />}
      {data && <AnnouncementList announcements={data} onChanged={reload} />}
    </>
  );
}

export default AnnouncementsTab;
