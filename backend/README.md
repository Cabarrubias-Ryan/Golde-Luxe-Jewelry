# Golde Luxe Backend (Gmail SMTP)

This backend accepts order form POSTs and forwards them to a Gmail inbox using Nodemailer and Gmail SMTP.

Setup

1. Ensure Node.js (v16+) is installed.
2. From the workspace root:

```
npm install
```

3. Copy `backend/.env.example` to `backend/.env` and set values:

- GMAIL_USER — your Gmail address
- GMAIL_APP_PASSWORD — an App Password from your Google account (recommended if 2FA is enabled)
- TO_EMAIL — where order emails will be delivered (defaults to GMAIL_USER)
- FROM_EMAIL — desired FROM address (defaults to GMAIL_USER)

How to create a Gmail App Password

1. Go to https://myaccount.google.com/security
2. Ensure 2-Step Verification is ON
3. Under "Signing in to Google", select "App passwords"
4. Create a new App Password for "Mail" and copy the generated password into `GMAIL_APP_PASSWORD`.

Run

```
npm run start
```

Endpoint

POST /send-order — accepts JSON body with order fields. The server will email the order to `TO_EMAIL`.
