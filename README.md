# Data Categorization App

Simple Express + SQLite application demonstrating:

- User self-register, login, logout
- Password reset (token emailed if SMTP is configured; otherwise reset link is printed to console)
- Item maintenance screen with list of retail items and ability to pick category from dropdown
- Tracking of who updated an item and when (updated_by and updated_at)

How to run

1. Install dependencies:

```powershell
npm install
```

2. Start the server:

```powershell
npm start
```

3. Open http://localhost:3000 in your browser.

Notes

- The app creates a SQLite database at `data.sqlite` in the project root and seeds some categories and items.
- Password reset links will be printed to server console unless you set SMTP environment variables (SMTP_HOST, SMTP_USER, SMTP_PASS).
- For production, change the session secret and use TLS/HTTPS and a proper SMTP/email provider.

Next steps (suggestions)

- Add item create/edit screens and search/filter
- Add pagination and user roles/permissions
- Add tests and input validation
