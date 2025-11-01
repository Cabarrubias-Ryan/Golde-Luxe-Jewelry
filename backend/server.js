require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
	console.warn('GMAIL_USER or GMAIL_APP_PASSWORD not set. Gmail SMTP will not be available until configured.');
}

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
	res.json({ status: 'ok', message: 'Golde Luxe backend running' });
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
		const transporter = nodemailer.createTransport({
			service: 'gmail',
			auth: {
				user: process.env.GMAIL_USER,
				pass: process.env.GMAIL_APP_PASSWORD
			}
		});

		const mailOptions = {
			from: fromEmail,
			to: toEmail,
			subject: `New order from ${name} - ${jewelryType}`,
			html
		};

		try {
			if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) throw new Error('GMAIL credentials not configured');
			await transporter.sendMail(mailOptions);
			return res.json({ ok: true, message: 'Order sent' });
		} catch (err) {
			console.error('Nodemailer error:', err && err.toString());
			return res.status(500).json({ error: 'Failed to send email', details: err && err.message });
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
