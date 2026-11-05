# Deployment

The project runs on three hosted services:

| Part | Service | Why |
| --- | --- | --- |
| Website and API | [Render](https://render.com) | One `render.yaml` file defines both, and each push to `main` redeploys them |
| Database | [Neon](https://neon.tech) | Hosted PostgreSQL. Render's free database is deleted after 30 days |
| Email | [Brevo](https://www.brevo.com) | Sends over HTTPS. Render's free plan blocks the SMTP ports Gmail uses |

All three have free plans. Choose the free option if a service offers an upgrade.

## 1. Put the code on GitHub

Create an empty **private** repository at https://github.com/new called `itu-lms`. Do not add a README or `.gitignore`. Then run this in the project folder, using your GitHub username:

```
git remote add origin https://github.com/YOUR_USERNAME/itu-lms.git
git push -u origin main
```

## 2. Create the database on Neon

1. Sign up at https://neon.tech and create a project called `itu-lms`. Pick the region closest to Singapore, which is where `render.yaml` runs the API.
2. On the project dashboard, click **Connect** and copy the connection string. It starts with `postgresql://` and ends with `sslmode=require`.

Keep this string private, because it contains the database password.

### Optional: copy your existing data

Run this in PowerShell from the project folder. Your local database is only read. Skip this to start with an empty system.

```
& "C:\Program Files\PostgreSQL\14\bin\pg_dump.exe" -U postgres -h localhost -Fc -f backups\for-hosting.dump Students
& "C:\Program Files\PostgreSQL\14\bin\pg_restore.exe" --no-owner --no-privileges -d "PASTE_NEON_CONNECTION_STRING" backups\for-hosting.dump
```

If `pg_dump` reports a server version mismatch, skip this step and tell whoever is helping you. Do not run the second command until the first one succeeds.

## 3. Set up email on Brevo

1. Sign up at https://www.brevo.com.
2. Go to **Senders, Domains & Dedicated IPs**, then **Senders**, and add the address emails should come from. Confirm it from the message Brevo sends you.
3. Go to **SMTP & API**, then **API Keys**, and generate a key. Copy it now, because it is only shown once.
4. Under **Security**, then **Authorized IPs**, turn off IP blocking if it is on. Render's addresses can change, and this setting would otherwise reject them.

The free plan allows about 300 emails a day.

## 4. Deploy on Render

1. Sign up at https://render.com with your GitHub account.
2. Click **New**, then **Blueprint**, and pick the `itu-lms` repository. Render reads `render.yaml`.
3. Fill in the values it asks for:

   | Setting | Value |
   | --- | --- |
   | `DATABASE_URL` | Neon connection string from step 2 |
   | `BREVO_API_KEY` | Key from step 3 |
   | `SENDER_EMAIL` | Address you verified in step 3 |
   | `ADMIN_EMAIL` | Email for the first admin account |
   | `ADMIN_PASSWORD` | A strong temporary password. You must change it at first login |

4. Click **Apply** and wait for both services to go live.

`ADMIN_EMAIL` and `ADMIN_PASSWORD` are only used if that admin does not exist yet. If you copied your data, use your existing admin email and sign in with your existing password.

## 5. Check the addresses

Render normally uses each service name in its address. If a name is taken, it adds extra characters. Open both services and compare their addresses with `render.yaml`:

- Website: `https://itu-lms-web.onrender.com`
- API: `https://itu-lms-api.onrender.com`

If either is different, update these in the Render dashboard:

| Service | Setting | Value |
| --- | --- | --- |
| `itu-lms-api` | `FRONTEND_ORIGINS` | Website address |
| `itu-lms-api` | `FRONTEND_URL` | Website address followed by `/login` |
| `itu-lms-web` | `VITE_API_URL` | API address |

Render redeploys `itu-lms-api` after a change. For the website, use **Manual Deploy**, because `VITE_API_URL` is built into the site.

## 6. Test it

1. Open `https://YOUR_API_ADDRESS/health`. It should show `{"status":"ok"}`.
2. Open the website, sign in as admin, and change the password when asked.
3. Add a student using an email you can check. The result message tells you whether Brevo accepted it.
4. Sign in as that student from your phone on mobile data.

## Day-to-day use

- **Updating the site:** push to `main`. CI runs the tests, and Render redeploys. Render does not wait for CI by default, so check that CI passed.
- **Database changes:** add an Alembic migration. It runs on the next deploy.
- **Logs:** open the service in Render and click **Logs**.

## Known limits of the free plans

- **The API sleeps after 15 minutes without traffic.** The next request takes about a minute while it wakes up, and the login screen says so. Open the site a few minutes before a demo.
- **Render allows 750 free instance hours a month** per workspace.
- **Backups:** the free plans here are not a full backup system. Run `pg_dump` against Neon before risky changes.
- **Email reputation:** a Gmail sender address has weak authentication when sent through another service, so messages may land in spam. A domain you own, verified in Brevo, is the proper fix.
- **Login lockouts** are stored in memory, so they reset when the API restarts.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| The site says it cannot reach the server | The API is waking up, or `VITE_API_URL` is wrong. Wait a minute, then check step 5 |
| The browser console shows a CORS error | `FRONTEND_ORIGINS` does not exactly match the website address. It must have no trailing slash |
| Pages 404 after a refresh | The rewrite rule in `render.yaml` is missing |
| The email result says it could not be sent | Check the API logs. A 401 usually means a wrong key or Authorized IPs is on. A 400 usually means the sender is not verified |
| The API fails at startup | Check `DATABASE_URL`, and that the service logs show migrations finishing |
