import fs from 'fs';
import path from 'path';

const COUNT_FILE = path.join(process.cwd(), 'data', 'waitlist_count.json');

function getCount() {
  try {
    const raw = fs.readFileSync(COUNT_FILE, 'utf8');
    return JSON.parse(raw).count || 47;
  } catch {
    return 47;
  }
}

function incrementCount() {
  const current = getCount();
  const next = current + 1;
  try {
    fs.writeFileSync(COUNT_FILE, JSON.stringify({ count: next }), 'utf8');
  } catch (err) {
    console.error('Failed to write count file:', err);
  }
  return next;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Droptly Waitlist <onboarding@resend.dev>',
        to: ['successscholars@gmail.com'],
        subject: `New waitlist signup: ${email}`,
        text: `${email} just joined the Droptly waitlist.`,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Resend error:', err);
      return res.status(500).json({ error: 'Failed to send' });
    }

    const newCount = incrementCount();
    return res.status(200).json({ ok: true, count: newCount });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}
