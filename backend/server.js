require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
	console.warn('GMAIL_USER or GMAIL_APP_PASSWORD not set. Gmail SMTP will not be available until configured.');
}

app.use(cors());
app.use(express.json());

// Serve static frontend from the repo's `main/` folder so the site root shows the website
const staticDir = path.join(__dirname, '..', 'main');
app.use(express.static(staticDir));
// Serve shared static assets (css, img) that live beside `main/`
app.use('/css', express.static(path.join(__dirname, '..', 'css')));
app.use('/img', express.static(path.join(__dirname, '..', 'img')));

// Keep a JSON status endpoint for health checks
app.get('/api/status', (req, res) => {
	res.json({ status: 'ok', message: 'Golde Luxe backend running' });
});

// Serve the main page for root and any unknown routes (SPA-friendly)
app.get('/', (req, res) => {
	res.sendFile(path.join(staticDir, 'main.html'));
});

/**
 * POST /send-order
 * Expected JSON body: { name, phone, email, address, city, province, postcode, jewelryType, quantity, engraving, paymentMethod, shippingOption, notes }
 */
app.post('/send-order', async (req, res) => {
	const {
		name,
		phone,
		email,
		address,
		barangay,
		city,
		province,
		postcode,
		jewelryType,
		quantity,
		engraving,
		paymentMethod,
		shippingOption,
		notes
	} = req.body || {};

	if (!name || !phone || !email || !address || !city || !province || !postcode || !jewelryType) {
		return res.status(400).json({ error: 'Missing required fields' });
	}

		const toEmail = process.env.TO_EMAIL || process.env.GMAIL_USER;
		const fromEmail = process.env.FROM_EMAIL || process.env.GMAIL_USER;

		if (!toEmail) return res.status(500).json({ error: 'Server not configured with TO_EMAIL or GMAIL_USER' });

		const html = `
			<h2>New Order from ${escapeHtml(name)}</h2>
			<p><strong>Contact Number:</strong> ${escapeHtml(phone)}</p>
			<p><strong>Email:</strong> ${escapeHtml(email)}</p>
			<p><strong>Address:</strong> ${escapeHtml(address)}, ${escapeHtml(barangay || '')}, ${escapeHtml(city)}, ${escapeHtml(province)} ${escapeHtml(postcode)}</p>
			<h3>Order Details</h3>
			<p><strong>Type:</strong> ${escapeHtml(jewelryType)}</p>
			<p><strong>Quantity:</strong> ${escapeHtml(String(quantity || '1'))}</p>
			<p><strong>Engraving:</strong> ${escapeHtml(engraving || 'No')}</p>
			<p><strong>Payment Method:</strong> ${escapeHtml(paymentMethod || '')}</p>
			<p><strong>Shipping Option:</strong> ${escapeHtml(shippingOption || '')}</p>
			<p><strong>Notes:</strong> ${escapeHtml(notes || '')}</p>
		`;

			// create transporter for Gmail using App Password
			// Use explicit SMTP settings and a longer timeout to avoid connection timeouts on some hosts
			const transporter = nodemailer.createTransport({
				host: 'smtp.gmail.com',
				port: 587,
				secure: false, // use STARTTLS
				requireTLS: true,
				auth: {
					user: process.env.GMAIL_USER,
					pass: process.env.GMAIL_APP_PASSWORD
				},
				tls: {
					// do not fail on invalid certs for some hosts (optional); remove in production if not needed
					rejectUnauthorized: false,
				},
				connectionTimeout: 30000,
				greetingTimeout: 30000,
				socketTimeout: 30000
			});

		const mailOptions = {
			from: fromEmail,
			to: toEmail,
			subject: `New order from ${name} - ${jewelryType}`,
			html
		};

			try {
				if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) throw new Error('GMAIL credentials not configured');
				// verify connection configuration (will attempt to connect)
				await transporter.verify();
				await transporter.sendMail(mailOptions);
				return res.json({ ok: true, message: 'Order sent' });
			} catch (err) {
				console.error('Nodemailer error:', err && err.toString());
				// give actionable hints for common errors
				const details = err && err.message ? err.message : String(err);
				let hint = '';
				if (details.match(/Timed out|ETIMEDOUT|Connection timeout/)) {
					hint = 'Connection timed out. Possible causes: outbound SMTP blocked by host, wrong port, or network issues.';
				} else if (details.match(/Invalid login|EAUTH/)) {
					hint = 'Authentication failed. Check GMAIL_USER and GMAIL_APP_PASSWORD (use an App Password with 2FA enabled).';
				} else if (details.match(/self signed certificate|UNABLE_TO_VERIFY_LEAF_SIGNATURE/)) {
					hint = 'TLS certificate verification failed. Consider enabling proper TLS or set rejectUnauthorized appropriately.';
				}
				return res.status(500).json({ error: 'Failed to send email', details, hint });
			}
});

app.listen(PORT, () => {
	console.log(`Server listening on port ${PORT}`);
});

function escapeHtml(str) {
	if (!str && str !== 0) return '';
	return String(str)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}
