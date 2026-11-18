# DataPilot on Vercel: setup in 6 steps

Files: index.html (the app), shim.js + config.js (sign-in, database, AI link), api/ai.js (AI function), supabase/schema.sql (database), vercel.json.

## 1. Supabase (free tier is fine for beta)
1. supabase.com -> New project (note the database password).
2. SQL Editor -> New query -> paste supabase/schema.sql -> Run.
3. Project Settings -> API: copy the Project URL and the anon public key.
4. Authentication -> URL Configuration: set Site URL to your Vercel address (add it after step 3 below). Authentication -> Providers -> Email: keep "Confirm email" ON for launch; turn it OFF only for a quick private test.

## 2. Gemini key
aistudio.google.com -> Get API key -> create a key. Check your usage limits there.

## 3. Deploy to Vercel
Vercel does not take a zip in the dashboard. Use one of these:
- GitHub: unzip, push the folder to a new GitHub repo, then Vercel -> Add New -> Project -> import it -> Deploy. No build settings.
- CLI: unzip, open a terminal in the folder, run `npx vercel --prod` and follow the prompts.

Before deploying, open config.js and paste your Supabase URL and anon key.

## 4. Vercel environment variables (Project -> Settings -> Environment Variables), then redeploy
- GEMINI_API_KEY = your Gemini key
- SUPABASE_URL = the same Project URL
- SUPABASE_ANON_KEY = the same anon key
- AI_MODEL = optional (default gemini-2.5-flash)

## 5. Make yourself Super Admin
Open your Vercel address, create your account, then in Supabase SQL Editor run (use your email):
insert into staff select id,'super' from auth.users where email='YOU@EXAMPLE.COM';
Reload DataPilot. The Admin tab appears. Repeat with 'admin' for other staff.

## 6. Launch checks
Register a test student, run an analysis, refresh (autosave), export Word and PDF, ask the AI, send feedback, check it shows in Admin. Then turn on Beta mode in Admin and invite your first 10 to 30 students.

## Know before launch
- The daily AI limit is enforced in the app, not on the server. Watch your Gemini usage in the first weeks.
- Usage counts come from students' browsers, so treat them as estimates.
- Add a privacy notice and support email before inviting students.
