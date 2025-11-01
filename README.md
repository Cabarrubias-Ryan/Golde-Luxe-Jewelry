# Golde Luxe Backend

This backend accepts order form POSTs and forwards them to a Gmail inbox using SendGrid.

Setup

1. Install Node.js (v16+ recommended).
2. In PowerShell, from the `backend` folder run:

```
npm install
```

3. Copy `.env.example` to `.env` and set values:

- SENDGRID_API_KEY — create an API key in SendGrid (Free tier available).
- TO_EMAIL — your Gmail address where orders will be sent.
- FROM_EMAIL — a verified sender or domain in SendGrid (or a no-reply address).

4. Start the server:

```
npm run start
```

Development (hot reload):

```
npm run dev
```

Endpoint

POST /send-order

Accepts JSON with order fields. The server will send a formatted email to `TO_EMAIL`.