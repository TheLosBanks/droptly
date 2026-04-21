import fs from 'fs';
import path from 'path';

const COUNT_FILE = path.join(process.cwd(), 'data', 'waitlist_count.json');

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const raw = fs.readFileSync(COUNT_FILE, 'utf8');
    const { count } = JSON.parse(raw);
    return res.status(200).json({ count: count || 47 });
  } catch {
    return res.status(200).json({ count: 47 });
  }
}
