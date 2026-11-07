import { Alert, Link } from "@mui/material";

const LIVE_SITE = "https://itu-lms-web.onrender.com";

// Only the dev server shows this. Accounts made locally exist only in the
// local database, so they cannot sign in on the live site.
function LocalCopyBanner({ sx }) {
  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <Alert severity="warning" sx={{ borderRadius: 0, ...sx }}>
      Local test copy. Students and teachers added here only exist on this computer. Add real
      people on the live site: <Link href={LIVE_SITE}>{LIVE_SITE.replace("https://", "")}</Link>
    </Alert>
  );
}

export default LocalCopyBanner;
