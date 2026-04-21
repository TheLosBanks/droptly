import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

const AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/m4a', 'audio/x-m4a', 'audio/wav', 'audio/wave', 'audio/x-wav'];
const VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-m4v'];
const ALLOWED_EXTS = ['.mp3', '.m4a', '.wav', '.mp4', '.mov'];

function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const boundary = (() => {
      const ct = req.headers['content-type'] || '';
      const match = ct.match(/boundary=([^\s;]+)/);
      return match ? match[1] : null;
    })();

    if (!boundary) return reject(new Error('No boundary found in content-type'));

    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const buffer = Buffer.concat(chunks);
      const boundaryBuf = Buffer.from('--' + boundary);
      const parts = [];
      let start = 0;

      while (true) {
        const idx = buffer.indexOf(boundaryBuf, start);
        if (idx === -1) break;
        const partStart = idx + boundaryBuf.length;
        if (buffer[partStart] === 45 && buffer[partStart + 1] === 45) break; // --boundary--
        const nextIdx = buffer.indexOf(boundaryBuf, partStart);
        if (nextIdx === -1) break;
        // Part content is between \r\n after boundary and \r\n before next boundary
        const partContent = buffer.slice(partStart + 2, nextIdx - 2); // skip \r\n prefix and suffix
        parts.push(partContent);
        start = nextIdx;
      }

      const files = {};
      for (const part of parts) {
        const headerEnd = part.indexOf('\r\n\r\n');
        if (headerEnd === -1) continue;
        const headerStr = part.slice(0, headerEnd).toString('utf8');
        const body = part.slice(headerEnd + 4);

        const nameMatch = headerStr.match(/name="([^"]+)"/);
        const filenameMatch = headerStr.match(/filename="([^"]+)"/);
        const ctMatch = headerStr.match(/Content-Type:\s*([^\r\n]+)/i);

        if (nameMatch && filenameMatch) {
          files[nameMatch[1]] = {
            filename: filenameMatch[1],
            contentType: ctMatch ? ctMatch[1].trim() : 'application/octet-stream',
            data: body,
          };
        }
      }
      resolve(files);
    });
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let files;
  try {
    files = await parseMultipart(req);
  } catch (err) {
    console.error('Multipart parse error:', err);
    return res.status(400).json({ error: 'Failed to parse upload' });
  }

  const file = files['file'];
  if (!file) {
    return res.status(400).json({ error: 'No file found in upload. Use field name "file".' });
  }

  const ext = path.extname(file.filename).toLowerCase();
  if (!ALLOWED_EXTS.includes(ext)) {
    return res.status(400).json({
      error: `Unsupported file type. Upload .mp3, .m4a, .wav (audio) or .mp4, .mov (video — coming soon).`,
    });
  }

  const isVideo = ext === '.mp4' || ext === '.mov' || VIDEO_TYPES.includes(file.contentType);

  if (isVideo) {
    return res.status(422).json({
      error: 'Video upload coming soon — upload an audio file (.mp3, .m4a, .wav) or use a YouTube URL instead.',
    });
  }

  // Save audio file to /tmp/
  const safeName = file.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const tmpPath = path.join('/tmp', `droptly_${Date.now()}_${safeName}`);
  try {
    fs.writeFileSync(tmpPath, file.data);
  } catch (err) {
    console.error('Failed to write to /tmp:', err);
    return res.status(500).json({ error: 'Failed to save uploaded file.' });
  }

  const baseName = path.basename(file.filename, ext);
  const title = baseName.replace(/[_-]/g, ' ');
  const mockTranscript = `Transcript extracted from ${file.filename}...\n\n[Full Whisper transcription will appear here in a future release. For now, paste a YouTube URL to get a real AI-generated content kit.]`;

  return res.status(200).json({
    ok: true,
    title,
    filename: file.filename,
    transcript: mockTranscript,
    tmpPath,
  });
}
