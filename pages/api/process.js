import Anthropic from '@anthropic-ai/sdk';
import { YoutubeTranscript } from 'youtube-transcript';

export const config = { maxDuration: 60 };

function extractVideoId(url) {
  const patterns = [
    /[?&]v=([^&]+)/,
    /youtu\.be\/([^?&]+)/,
    /youtube\.com\/embed\/([^?&]+)/,
    /youtube\.com\/shorts\/([^?&]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export default async function handler(req, res) {
  try {
    return await processRequest(req, res);
  } catch (err) {
    console.error('Unhandled error in /api/process:', err);
    return res.status(500).json({ error: 'Server error. Try a different YouTube video.' });
  }
}

async function processRequest(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL required' });

  const videoId = extractVideoId(url);
  if (!videoId) {
    return res.status(400).json({ error: 'Invalid YouTube URL. Paste a youtube.com or youtu.be link.' });
  }

  let transcriptItems;
  try {
    transcriptItems = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });
  } catch {
    // Retry without language constraint (some videos only have auto-captions)
    try {
      transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
    } catch (err) {
      console.error('Transcript fetch failed for', videoId, err?.message);
      return res.status(422).json({ error: 'No captions found for this video. Try a regular YouTube video (not Shorts) that has auto-captions enabled.' });
    }
  }

  if (!transcriptItems || transcriptItems.length === 0) {
    return res.status(422).json({ error: 'Transcript was empty. Try a different video.' });
  }

  const rawTranscript = transcriptItems.map((t) => t.text).join(' ');
  // Truncate to ~12k chars to keep Claude costs low (~$0.02-0.05 per call)
  const transcript = rawTranscript.slice(0, 12000);

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let message;
  try {
    message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: `You are a content repurposing expert. Analyze this YouTube transcript and return a JSON object with exactly these keys. Return ONLY valid JSON — no markdown, no explanation, no code fences.

{
  "summary": "2-3 sentence summary of what this video is about",
  "transcript_clean": "a clean, readable version of the transcript (max 600 words, fix filler words and repetition)",
  "carousel": [
    {"slide": 1, "headline": "Hook slide headline (max 8 words)", "body": "1-2 supporting sentences"},
    ...
  ],
  "tweets": [
    "tweet text under 280 chars",
    ...
  ],
  "hooks": [
    "Short-form video opening hook under 25 words",
    "hook variant 2",
    "hook variant 3"
  ],
  "blog_outline": {
    "title": "SEO blog post title",
    "meta": "meta description under 155 chars",
    "sections": [
      {"h2": "Section heading", "points": ["talking point 1", "talking point 2"]}
    ]
  },
  "shorts": [
    {
      "title": "Short title for this clip (under 50 chars)",
      "hook": "Opening line — first 5 seconds, stops the scroll",
      "script": "Full Short script (40-50 seconds when read aloud). One idea, delivered fast. No intro fluff.",
      "cta": "Closing line — subscribe/follow/comment prompt",
      "audio_style": "Trending audio style that fits this clip (e.g. 'dramatic pause + bass drop', 'upbeat lo-fi', 'viral speech overlay')"
    }
  ],
  "hashtags": {
    "linkedin": ["hashtag1", "hashtag2"],
    "instagram": ["hashtag1", "hashtag2"],
    "tiktok": ["hashtag1", "hashtag2"]
  }
}

Rules:
- carousel: 6-8 slides, slide 1 is a hook, last slide is a CTA
- tweets: 8-10 tweets forming a thread, each under 280 chars
- hooks: exactly 3 variants
- shorts: exactly 5 clips extracted from the strongest moments of the video. Each script must be under 150 words (fits in 60 seconds). No intro, no "hey guys", just value immediately.
- hashtags: 8-10 per platform, no # prefix, lowercase

TRANSCRIPT:
${transcript}`,
        },
      ],
    });
  } catch (err) {
    console.error('Claude API error:', err);
    return res.status(500).json({ error: 'AI processing failed. Try again.' });
  }

  let kit;
  try {
    kit = JSON.parse(message.content[0].text);
  } catch {
    console.error('JSON parse failed:', message.content[0].text.slice(0, 200));
    return res.status(500).json({ error: 'Failed to parse AI output. Try again.' });
  }

  return res.status(200).json({ kit });
}
