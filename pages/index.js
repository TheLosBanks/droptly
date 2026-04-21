import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';

// Tab configuration for the kit preview
const KIT_TABS = [
  { id: 'carousel', label: 'Carousel' },
  { id: 'thread', label: 'Thread' },
  { id: 'hooks', label: 'Hooks' },
  { id: 'shorts', label: 'Shorts' },
  { id: 'blog', label: 'Blog' },
  { id: 'hashtags', label: 'Hashtags' },
  { id: 'transcript', label: 'Transcript' },
];

// Build a full .txt download string from the kit
function buildKitText(kit) {
  const lines = [];
  lines.push('=== DROPTLY CONTENT KIT ===');
  lines.push('');
  if (kit.summary) {
    lines.push('--- SUMMARY ---');
    lines.push(kit.summary);
    lines.push('');
  }
  if (kit.carousel && kit.carousel.length) {
    lines.push('--- CAROUSEL SLIDES ---');
    kit.carousel.forEach((s, i) => {
      lines.push(`Slide ${i + 1}: ${s.headline}`);
      lines.push(s.body);
      lines.push('');
    });
  }
  if (kit.tweets && kit.tweets.length) {
    lines.push('--- TWEET THREAD ---');
    kit.tweets.forEach((t, i) => {
      lines.push(`${i + 1}/ ${t}`);
      lines.push('');
    });
  }
  if (kit.hooks && kit.hooks.length) {
    lines.push('--- SHORT-FORM HOOKS ---');
    kit.hooks.forEach((h, i) => {
      lines.push(`Hook ${i + 1}: ${h}`);
      lines.push('');
    });
  }
  if (kit.shorts && kit.shorts.length) {
    lines.push('--- YOUTUBE SHORTS SCRIPTS ---');
    kit.shorts.forEach((s, i) => {
      lines.push(`Short ${i + 1}: ${s.title}`);
      lines.push(`Hook: "${s.hook}"`);
      lines.push(`Script: ${s.script}`);
      lines.push(`CTA: ${s.cta}`);
      lines.push(`Audio style: ${s.audio_style}`);
      lines.push('');
    });
  }
  if (kit.blog_outline) {
    lines.push('--- BLOG OUTLINE ---');
    lines.push(`Title: ${kit.blog_outline.title}`);
    lines.push(`Meta: ${kit.blog_outline.meta}`);
    if (kit.blog_outline.sections) {
      kit.blog_outline.sections.forEach((sec) => {
        lines.push(`\n## ${sec.h2}`);
        if (sec.points) sec.points.forEach((p) => lines.push(`  - ${p}`));
      });
    }
    lines.push('');
  }
  if (kit.hashtags) {
    lines.push('--- HASHTAGS ---');
    if (kit.hashtags.linkedin) lines.push(`LinkedIn: ${kit.hashtags.linkedin.map(h => '#' + h).join(' ')}`);
    if (kit.hashtags.instagram) lines.push(`Instagram: ${kit.hashtags.instagram.map(h => '#' + h).join(' ')}`);
    if (kit.hashtags.tiktok) lines.push(`TikTok: ${kit.hashtags.tiktok.map(h => '#' + h).join(' ')}`);
    lines.push('');
  }
  if (kit.transcript_clean) {
    lines.push('--- CLEAN TRANSCRIPT ---');
    lines.push(kit.transcript_clean);
    lines.push('');
  }
  return lines.join('\n');
}

function downloadTxt(text, filename) {
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function Home() {
  const [scrolled, setScrolled] = useState(false);

  // Input mode: 'url' | 'upload'
  const [inputMode, setInputMode] = useState('url');
  const [url, setUrl] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null); // null | 'uploading' | 'done' | 'error'
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  const [demoStatus, setDemoStatus] = useState(null); // null | 'loading' | 'done' | 'error'
  const [demoError, setDemoError] = useState(null);
  const [kit, setKit] = useState(null);

  // Waitlist modal
  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [waitlistStatus, setWaitlistStatus] = useState(null);

  // Waitlist counter
  const [waitlistCount, setWaitlistCount] = useState(47);

  // Kit preview tabs
  const [activeTab, setActiveTab] = useState('carousel');
  const tabsRef = useRef(null);

  // Copy feedback
  const [copyFeedback, setCopyFeedback] = useState({}); // { [tabId]: 'copied' | null }

  // Gate: whether user has unlocked full kit
  const [kitUnlocked, setKitUnlocked] = useState(false);

  function openModal(e) {
    if (e) e.preventDefault();
    setModalOpen(true);
    setWaitlistStatus(null);
    setEmail('');
  }

  function openGatedModal(e) {
    if (e) e.preventDefault();
    if (!kitUnlocked) {
      openModal(e);
    }
  }

  async function submitWaitlist(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setWaitlistStatus('loading');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.count) setWaitlistCount(data.count);
        setWaitlistStatus('done');
        setKitUnlocked(true);
      } else {
        setWaitlistStatus('error');
      }
    } catch {
      setWaitlistStatus('error');
    }
  }

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch waitlist count on load
  useEffect(() => {
    fetch('/api/waitlist-count')
      .then((r) => r.json())
      .then((d) => { if (d.count) setWaitlistCount(d.count); })
      .catch(() => {});
  }, []);

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploadFile(file);
    setUploadStatus(null);
    setUploadError(null);
  }

  async function uploadAndProcess() {
    if (!uploadFile) {
      setUploadStatus('error');
      setUploadError('Select a file first');
      return;
    }
    setUploadStatus('uploading');
    setUploadError(null);
    setKit(null);

    const formData = new FormData();
    formData.append('file', uploadFile);

    let uploadData;
    try {
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        setUploadStatus('error');
        setUploadError(uploadData.error || 'Upload failed');
        return;
      }
    } catch {
      setUploadStatus('error');
      setUploadError('Upload failed. Try again.');
      return;
    }

    // Now process with the mock transcript
    setUploadStatus('done');
    setDemoStatus('loading');
    setDemoError(null);
    try {
      const res = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: uploadData.transcript }),
      });
      let data;
      try { data = await res.json(); } catch {
        setDemoStatus('error');
        setDemoError('Server error.');
        return;
      }
      if (!res.ok) {
        setDemoStatus('error');
        setDemoError(data.error || 'Something went wrong');
        return;
      }
      setKit(data.kit);
      setDemoStatus('done');
      setActiveTab('carousel');
    } catch {
      setDemoStatus('error');
      setDemoError('Connection error. Try again.');
    }
  }

  async function generate() {
    if (!url.trim()) {
      setDemoStatus('error');
      setDemoError('Drop a URL first');
      setTimeout(() => { setDemoStatus(null); setDemoError(null); }, 1500);
      return;
    }
    setDemoStatus('loading');
    setDemoError(null);
    setKit(null);
    try {
      const res = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      let data;
      try { data = await res.json(); } catch {
        setDemoStatus('error');
        setDemoError('Server error. Try a different YouTube video.');
        return;
      }
      if (!res.ok) {
        setDemoStatus('error');
        setDemoError(data.error || 'Something went wrong');
        return;
      }
      setKit(data.kit);
      setDemoStatus('done');
      setActiveTab('carousel');
    } catch {
      setDemoStatus('error');
      setDemoError('Connection error. Try again.');
    }
  }

  // Build tab content text for copy/download
  function getTabText(tabId) {
    if (!kit) return '';
    switch (tabId) {
      case 'carousel':
        return (kit.carousel || []).map((s, i) => `Slide ${i + 1}: ${s.headline}\n${s.body}`).join('\n\n');
      case 'thread':
        return (kit.tweets || []).map((t, i) => `${i + 1}/ ${t}`).join('\n\n');
      case 'hooks':
        return (kit.hooks || []).map((h, i) => `Hook ${i + 1}: ${h}`).join('\n\n');
      case 'shorts':
        return (kit.shorts || []).map((s, i) =>
          `Short ${i + 1}: ${s.title}\nHook: "${s.hook}"\nScript: ${s.script}\nCTA: ${s.cta}\nAudio: ${s.audio_style}`
        ).join('\n\n---\n\n');
      case 'blog':
        if (!kit.blog_outline) return '';
        return [
          `Title: ${kit.blog_outline.title}`,
          `Meta: ${kit.blog_outline.meta}`,
          '',
          ...(kit.blog_outline.sections || []).flatMap((sec) => [
            `## ${sec.h2}`,
            ...(sec.points || []).map((p) => `  - ${p}`),
            '',
          ]),
        ].join('\n');
      case 'hashtags':
        if (!kit.hashtags) return '';
        return [
          kit.hashtags.linkedin ? `LinkedIn: ${kit.hashtags.linkedin.map(h => '#' + h).join(' ')}` : '',
          kit.hashtags.instagram ? `Instagram: ${kit.hashtags.instagram.map(h => '#' + h).join(' ')}` : '',
          kit.hashtags.tiktok ? `TikTok: ${kit.hashtags.tiktok.map(h => '#' + h).join(' ')}` : '',
        ].filter(Boolean).join('\n\n');
      case 'transcript':
        return kit.transcript_clean || '';
      default:
        return '';
    }
  }

  async function handleCopy(tabId, e) {
    if (e) e.preventDefault();
    if (!kitUnlocked) { openModal(); return; }
    const text = getTabText(tabId);
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback((prev) => ({ ...prev, [tabId]: 'copied' }));
      setTimeout(() => setCopyFeedback((prev) => ({ ...prev, [tabId]: null })), 2000);
    } catch {
      setCopyFeedback((prev) => ({ ...prev, [tabId]: 'error' }));
      setTimeout(() => setCopyFeedback((prev) => ({ ...prev, [tabId]: null })), 2000);
    }
  }

  function handleDownload(e) {
    if (e) e.preventDefault();
    if (!kitUnlocked) { openModal(); return; }
    if (!kit) return;
    const text = buildKitText(kit);
    downloadTxt(text, 'droptly-content-kit.txt');
  }

  // Keyboard nav for tabs
  const handleTabKeyDown = useCallback((e, currentIdx) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIdx = (currentIdx + 1) % KIT_TABS.length;
      setActiveTab(KIT_TABS[nextIdx].id);
      const tabs = tabsRef.current?.querySelectorAll('[role="tab"]');
      if (tabs) tabs[nextIdx]?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIdx = (currentIdx - 1 + KIT_TABS.length) % KIT_TABS.length;
      setActiveTab(KIT_TABS[prevIdx].id);
      const tabs = tabsRef.current?.querySelectorAll('[role="tab"]');
      if (tabs) tabs[prevIdx]?.focus();
    }
  }, []);

  const tickerItems = [
    'YouTube Videos', 'Podcasts', 'Livestreams', 'Audio Files',
    'Webinars', 'Interviews', 'Courses',
  ];

  // Render tab panel content
  function renderTabContent(tabId) {
    if (!kit) return null;
    switch (tabId) {
      case 'carousel':
        return (
          <div className="tab-list">
            {(kit.carousel || []).map((slide, i) => (
              <div key={i} className="tab-item">
                <div className="tab-item-meta">Slide {slide.slide || i + 1}</div>
                <div className="tab-item-headline">{slide.headline}</div>
                <p className="tab-item-body">{slide.body}</p>
              </div>
            ))}
          </div>
        );
      case 'thread':
        return (
          <div className="tab-list">
            {(kit.tweets || []).map((tweet, i) => (
              <div key={i} className="tab-item">
                <div className="tab-item-meta">{i + 1}/{kit.tweets.length}</div>
                <p className="tab-item-body">{tweet}</p>
              </div>
            ))}
          </div>
        );
      case 'hooks':
        return (
          <div className="tab-list">
            {(kit.hooks || []).map((hook, i) => (
              <div key={i} className="tab-item">
                <div className="tab-item-meta">Hook {i + 1}</div>
                <p className="tab-item-body tab-item-hook">{hook}</p>
              </div>
            ))}
          </div>
        );
      case 'shorts':
        return (
          <div className="tab-list">
            {(kit.shorts || []).map((s, i) => (
              <div key={i} className="tab-item tab-item-short">
                <div className="tab-item-meta">Short {i + 1}</div>
                <div className="tab-item-headline">{s.title}</div>
                <p className="tab-item-sublabel">Hook</p>
                <p className="tab-item-body" style={{ fontStyle: 'italic' }}>&ldquo;{s.hook}&rdquo;</p>
                <p className="tab-item-sublabel">Script</p>
                <p className="tab-item-body">{s.script}</p>
                <p className="tab-item-sublabel">CTA</p>
                <p className="tab-item-body">{s.cta}</p>
                <p className="tab-item-sublabel">Audio style</p>
                <p className="tab-item-body tab-item-tag">{s.audio_style}</p>
              </div>
            ))}
          </div>
        );
      case 'blog':
        if (!kit.blog_outline) return <p className="tab-empty">No blog outline generated.</p>;
        return (
          <div className="tab-blog">
            <div className="tab-item-headline" style={{ marginBottom: '0.25rem' }}>{kit.blog_outline.title}</div>
            <p className="tab-item-meta" style={{ marginBottom: '1.5rem' }}>{kit.blog_outline.meta}</p>
            {(kit.blog_outline.sections || []).map((sec, i) => (
              <div key={i} className="tab-blog-section">
                <div className="tab-blog-h2">{sec.h2}</div>
                <ul className="tab-blog-points">
                  {(sec.points || []).map((pt, j) => (
                    <li key={j}>{pt}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        );
      case 'hashtags':
        if (!kit.hashtags) return <p className="tab-empty">No hashtags generated.</p>;
        return (
          <div className="tab-hashtags">
            {kit.hashtags.linkedin && (
              <div className="tab-hashtag-group">
                <div className="tab-item-meta">LinkedIn</div>
                <div className="tab-hashtag-pills">
                  {kit.hashtags.linkedin.map((h, i) => (
                    <span key={i} className="hashtag-pill">#{h}</span>
                  ))}
                </div>
              </div>
            )}
            {kit.hashtags.instagram && (
              <div className="tab-hashtag-group">
                <div className="tab-item-meta">Instagram</div>
                <div className="tab-hashtag-pills">
                  {kit.hashtags.instagram.map((h, i) => (
                    <span key={i} className="hashtag-pill">#{h}</span>
                  ))}
                </div>
              </div>
            )}
            {kit.hashtags.tiktok && (
              <div className="tab-hashtag-group">
                <div className="tab-item-meta">TikTok</div>
                <div className="tab-hashtag-pills">
                  {kit.hashtags.tiktok.map((h, i) => (
                    <span key={i} className="hashtag-pill">#{h}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      case 'transcript':
        return (
          <div className="tab-transcript">
            <p className="tab-item-body">{kit.transcript_clean || 'No transcript available.'}</p>
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <>
      <Head>
        <title>Droptly — One recording. A week of content.</title>
        <meta name="description" content="Turn any video or audio recording into a full week of content. Transcripts, carousels, tweet threads, blog outlines, and more — in under 60 seconds." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400&family=DM+Mono:wght@400&display=swap" rel="stylesheet" />
      </Head>

      {/* NAV */}
      <nav className={`nav${scrolled ? ' scrolled' : ''}`}>
        <a href="#" className="logo">drop<span>tly</span></a>
        <ul className="nav-links">
          <li><a href="#how-it-works">How it works</a></li>
          <li><a href="#what-you-get">What you get</a></li>
          <li><a href="#pricing">Pricing</a></li>
          <li><a href="#" className="nav-cta" onClick={openModal}>Try free →</a></li>
        </ul>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-glow" />
        <p className="hero-tag">// AI content repurposing</p>
        <h1>One recording.<br /><em>A week</em> of content.</h1>
        <p className="hero-sub">
          Paste a YouTube link, podcast URL, or upload a file. Droptly extracts your
          best ideas and generates a full content kit — ready to publish.
        </p>
        <div className="hero-actions">
          <a href="#" className="btn-primary" onClick={openModal}>Start for free →</a>
          <a href="#how-it-works" className="btn-ghost">See how it works</a>
        </div>
        <p className="waitlist-counter">Join {waitlistCount}+ creators already on the waitlist</p>

        {/* DROP DEMO */}
        <div
          className="drop-demo"
          style={demoStatus === 'error' ? { borderColor: 'var(--accent2)' } : {}}
        >
          {/* Input mode toggle */}
          <div className="input-tabs">
            <button
              className={`input-tab${inputMode === 'url' ? ' active' : ''}`}
              onClick={() => { setInputMode('url'); setUploadFile(null); setUploadStatus(null); setUploadError(null); }}
            >
              YouTube URL
            </button>
            <button
              className={`input-tab${inputMode === 'upload' ? ' active' : ''}`}
              onClick={() => setInputMode('upload')}
            >
              Upload File
            </button>
          </div>

          <div className="drop-inner">
            <div className="drop-icon">🎙</div>

            {inputMode === 'url' ? (
              <>
                <p className="drop-label">
                  <strong>Paste any recording URL to try it</strong><br />
                  YouTube, Spotify, Loom, or direct audio link
                </p>
                <input
                  className="drop-input"
                  type="text"
                  placeholder="https://youtube.com/watch?v=..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && generate()}
                />
              </>
            ) : (
              <>
                <p className="drop-label">
                  <strong>Upload an audio file</strong><br />
                  .mp3, .mp4, .m4a, .wav, .mov accepted
                </p>
                <div
                  className="file-drop-zone"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadFile ? (
                    <span className="file-name">{uploadFile.name}</span>
                  ) : (
                    <span className="file-placeholder">Click to select file</span>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".mp3,.mp4,.m4a,.wav,.mov,audio/*"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
                {uploadStatus === 'uploading' && (
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.8rem', color: 'var(--accent)' }}>
                    ⬆ Uploading file...
                  </p>
                )}
                {uploadStatus === 'done' && (
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.8rem', color: 'var(--accent)' }}>
                    ✓ File uploaded
                  </p>
                )}
                {uploadStatus === 'error' && (
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.8rem', color: 'var(--accent2)' }}>
                    ↑ {uploadError || 'Upload failed'}
                  </p>
                )}
              </>
            )}

            {demoStatus === 'loading' && (
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.8rem', color: 'var(--accent)' }}>
                ⚡ Fetching transcript &amp; generating your kit...
              </p>
            )}
            {demoStatus === 'done' && (
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.8rem', color: 'var(--accent)' }}>
                ✓ Kit ready
              </p>
            )}
            {demoStatus === 'error' && (
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.8rem', color: 'var(--accent2)' }}>
                ↑ {demoError || 'Something went wrong'}
              </p>
            )}

            <button
              className="drop-btn"
              onClick={inputMode === 'url' ? generate : uploadAndProcess}
              disabled={demoStatus === 'loading' || uploadStatus === 'uploading'}
            >
              {(demoStatus === 'loading' || uploadStatus === 'uploading') ? 'Processing...' : 'Generate my content kit'}
            </button>

            <div className="output-cards">
              {['transcript', 'carousel', 'tweet thread', 'hook', 'shorts scripts', 'blog outline', 'hashtags'].map((item) => (
                <span key={item} className="output-pill">{item}</span>
              ))}
            </div>
          </div>
        </div>

        {/* KIT PREVIEW — tabbed interface */}
        {kit && (
          <div className="kit-preview">
            <p className="section-label" style={{ textAlign: 'center', marginBottom: '0.5rem' }}>// your content kit</p>
            <p className="kit-summary">{kit.summary}</p>

            {/* Tab bar */}
            <div className="kit-tab-bar" ref={tabsRef} role="tablist" aria-label="Content kit sections">
              {KIT_TABS.map((tab, idx) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`tab-panel-${tab.id}`}
                  id={`tab-${tab.id}`}
                  className={`kit-tab${activeTab === tab.id ? ' active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                  onKeyDown={(e) => handleTabKeyDown(e, idx)}
                  tabIndex={activeTab === tab.id ? 0 : -1}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab panel */}
            {KIT_TABS.map((tab) => (
              <div
                key={tab.id}
                role="tabpanel"
                id={`tab-panel-${tab.id}`}
                aria-labelledby={`tab-${tab.id}`}
                className="kit-tab-panel"
                hidden={activeTab !== tab.id}
              >
                {/* Action buttons top-right */}
                <div className="kit-panel-actions">
                  <button
                    className="kit-action-btn"
                    onClick={(e) => handleCopy(tab.id, e)}
                    title="Copy to clipboard"
                  >
                    {copyFeedback[tab.id] === 'copied' ? '✓ Copied' : copyFeedback[tab.id] === 'error' ? '✗ Failed' : 'Copy'}
                  </button>
                  <button
                    className="kit-action-btn"
                    onClick={handleDownload}
                    title="Download full kit as .txt"
                  >
                    Download .txt
                  </button>
                </div>

                <div className="kit-panel-content">
                  {renderTabContent(tab.id)}
                </div>
              </div>
            ))}

            {!kitUnlocked && (
              <div className="kit-gate">
                <p>Copy, download, or export your full kit — join the waitlist to unlock.</p>
                <a href="#" className="btn-primary" onClick={openModal}>Unlock full kit →</a>
              </div>
            )}
          </div>
        )}
      </section>

      {/* TICKER */}
      <div className="ticker-wrap">
        <div className="ticker">
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <span key={i}>
              {i % 2 === 0 ? <span>✦</span> : null} {item}
            </span>
          ))}
        </div>
      </div>

      {/* STAT BAR */}
      <div className="stat-bar">
        <div className="stat">
          <div className="stat-num">7</div>
          <div className="stat-label">Content pieces</div>
        </div>
        <div className="stat">
          <div className="stat-num">&lt;60s</div>
          <div className="stat-label">Generation time</div>
        </div>
        <div className="stat">
          <div className="stat-num">3h</div>
          <div className="stat-label">Saved per recording</div>
        </div>
        <div className="stat">
          <div className="stat-num">∞</div>
          <div className="stat-label">Recordings supported</div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section className="section" id="how-it-works">
        <p className="section-label">// How it works</p>
        <h2>Three steps. Zero effort.</h2>
        <div className="steps">
          <div className="step">
            <div className="step-num">01</div>
            <h3>Paste a URL or upload a file</h3>
            <p>Drop a YouTube link, podcast URL, or upload an audio file. We handle any format.</p>
          </div>
          <div className="step">
            <div className="step-num">02</div>
            <h3>AI generates your full content kit</h3>
            <p>Our AI transcribes, analyzes, and generates carousels, threads, hooks, shorts, blog outlines, and hashtags in seconds.</p>
          </div>
          <div className="step">
            <div className="step-num">03</div>
            <h3>Copy, export, post — done</h3>
            <p>Copy any section to clipboard or download the full kit as a text file. Ready to paste directly into your scheduling tool.</p>
          </div>
        </div>

        {/* Demo video placeholder */}
        <div className="demo-video-placeholder" id="demo">
          <div className="demo-video-inner">
            <div className="demo-video-icon">▶</div>
            <p className="demo-video-label">Demo coming soon</p>
            <p className="demo-video-sub">A screen recording will appear here showing the full Droptly workflow end-to-end.</p>
          </div>
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section className="outputs" id="what-you-get">
        <div className="outputs-inner">
          <p className="section-label">// What you get</p>
          <h2>Everything you need. Nothing you don&apos;t.</h2>
          <div className="output-grid">
            <div className="output-item">
              <div className="output-icon">📄</div>
              <h4>Full Transcript</h4>
              <p>Clean, timestamped transcript of your entire recording with speaker labels where possible.</p>
              <span className="output-badge">Always included</span>
            </div>
            <div className="output-item">
              <div className="output-icon">🎠</div>
              <h4>Carousel Copy</h4>
              <p>Slide-by-slide copy for LinkedIn or Instagram carousels, structured around your top insights.</p>
              <span className="output-badge">6–10 slides</span>
            </div>
            <div className="output-item">
              <div className="output-icon">🐦</div>
              <h4>Tweet Thread</h4>
              <p>A punchy, high-retention Twitter/X thread that distills your best ideas into shareable tweets.</p>
              <span className="output-badge">8–12 tweets</span>
            </div>
            <div className="output-item">
              <div className="output-icon">⚡</div>
              <h4>Short-Form Hook</h4>
              <p>Three variations of an opening hook for TikTok, Reels, or YouTube Shorts to maximize watch time.</p>
              <span className="output-badge">3 variants</span>
            </div>
            <div className="output-item">
              <div className="output-icon">📝</div>
              <h4>Blog Outline</h4>
              <p>An SEO-structured blog post outline with H2s, talking points, and a suggested meta description.</p>
              <span className="output-badge">Ready to write</span>
            </div>
            <div className="output-item">
              <div className="output-icon">🎬</div>
              <h4>Shorts Scripts</h4>
              <p>5 ready-to-record YouTube Shorts scripts pulled from the strongest moments of your video. Hook, script, CTA — done.</p>
              <span className="output-badge">5 scripts</span>
            </div>
            <div className="output-item">
              <div className="output-icon">#</div>
              <h4>Hashtag Sets</h4>
              <p>Platform-specific hashtag sets for LinkedIn, Instagram, and TikTok to maximize organic reach.</p>
              <span className="output-badge">30+ tags</span>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="testimonials">
        <p className="section-label">// What creators say</p>
        <h2>Built for people who make things.</h2>
        <div className="testi-grid">
          <div className="testi-card">
            <p className="testi-text">
              &ldquo;I record one long podcast per week and used to spend Sunday afternoon manually clipping content. Droptly cut that to about 10 minutes. It&apos;s genuinely changed my workflow.&rdquo;
            </p>
            <div className="testi-author">
              <div className="testi-avatar" style={{ background: '#2a2a20', color: 'var(--accent)' }}>MR</div>
              <div>
                <div className="testi-name">Marcus R.</div>
                <div className="testi-handle">@marcusbuilds · 24k followers</div>
              </div>
            </div>
          </div>
          <div className="testi-card">
            <p className="testi-text">
              &ldquo;The carousel copy it generates is scary good. My engagement went up 40% the first month because I was actually posting consistently instead of procrastinating on repurposing.&rdquo;
            </p>
            <div className="testi-author">
              <div className="testi-avatar" style={{ background: '#201a2a', color: 'var(--accent2)' }}>DK</div>
              <div>
                <div className="testi-name">Diana K.</div>
                <div className="testi-handle">@dianakwrites · 11k followers</div>
              </div>
            </div>
          </div>
          <div className="testi-card">
            <p className="testi-text">
              &ldquo;As a solo founder, I wear too many hats. Droptly is like having a content team for $19 a month. I feed it my webinar recordings and it handles the rest.&rdquo;
            </p>
            <div className="testi-author">
              <div className="testi-avatar" style={{ background: '#1a201a', color: 'var(--accent)' }}>TN</div>
              <div>
                <div className="testi-name">Theo N.</div>
                <div className="testi-handle">@theonakamura · SaaS founder</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="pricing" id="pricing">
        <div className="pricing-inner">
          <p className="section-label">// Pricing</p>
          <h2>Simple, honest pricing.</h2>
          <div className="pricing-grid">
            <div className="price-card">
              <p className="price-tier">Free</p>
              <div className="price-amount">$0</div>
              <p className="price-period">forever, no card required</p>
              <ul className="price-features">
                <li>5 recordings per month</li>
                <li>All 6 output types</li>
                <li>YouTube &amp; podcast URLs</li>
                <li>Export as plain text</li>
              </ul>
              <button className="price-btn" onClick={openModal}>Get started free</button>
            </div>
            <div className="price-card featured">
              <p className="price-tier">Pro</p>
              <div className="price-amount">$19</div>
              <p className="price-period">per month, billed monthly</p>
              <ul className="price-features">
                <li>Unlimited recordings</li>
                <li>All 6 output types</li>
                <li>File uploads (MP3, MP4, M4A)</li>
                <li>Export as Markdown &amp; Notion</li>
                <li>Priority processing</li>
              </ul>
              <button className="price-btn" onClick={openModal}>Start Pro free for 7 days</button>
            </div>
            <div className="price-card">
              <p className="price-tier">Teams</p>
              <div className="price-amount">$49</div>
              <p className="price-period">per month, up to 5 seats</p>
              <ul className="price-features">
                <li>Everything in Pro</li>
                <li>5 team members</li>
                <li>Shared workspace</li>
                <li>Custom brand voice</li>
                <li>Slack integration</li>
              </ul>
              <button className="price-btn" onClick={openModal}>Try Teams free</button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <p className="section-label">// Get started today</p>
        <h2>Stop leaving content on the table.</h2>
        <p>Every recording you post without repurposing is reach you&apos;ll never get back.</p>
        <p className="waitlist-counter" style={{ marginBottom: '2rem' }}>Join {waitlistCount}+ creators already on the waitlist</p>
        <div className="hero-actions" style={{ justifyContent: 'center' }}>
          <a href="#" className="btn-primary" onClick={openModal}>Join the waitlist →</a>
          <a href="#how-it-works" className="btn-ghost">See how it works</a>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <p>© 2026 Droptly. All rights reserved.</p>
        <ul className="nav-links">
          <li><a href="#">Privacy</a></li>
          <li><a href="#">Terms</a></li>
          <li><a href="#">Twitter</a></li>
          <li><a href="#">Contact</a></li>
        </ul>
      </footer>

      {/* WAITLIST MODAL */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setModalOpen(false)}>×</button>
            {waitlistStatus === 'done' ? (
              <div className="modal-success">
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>✓</div>
                <h3>You&apos;re on the list.</h3>
                <p>We&apos;ll email you when Droptly is ready. Appreciate you.</p>
                {kit && (
                  <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--accent)', fontFamily: "'DM Mono', monospace" }}>
                    Your content kit is now fully unlocked above.
                  </p>
                )}
              </div>
            ) : (
              <>
                <p className="hero-tag" style={{ marginBottom: '1rem' }}>// early access</p>
                <h3 className="modal-title">Join the waitlist</h3>
                <p className="modal-sub">
                  Be first to know when Droptly launches. No spam — one email when we&apos;re live.
                  <br />
                  <span style={{ color: 'var(--accent)', fontFamily: "'DM Mono', monospace", fontSize: '0.75rem' }}>
                    {waitlistCount}+ creators already signed up
                  </span>
                </p>
                <form className="modal-form" onSubmit={submitWaitlist}>
                  <input
                    className="drop-input"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                  <button className="drop-btn" type="submit" disabled={waitlistStatus === 'loading'}>
                    {waitlistStatus === 'loading' ? 'Submitting...' : 'Notify me →'}
                  </button>
                  {waitlistStatus === 'error' && (
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.75rem', color: 'var(--accent2)', textAlign: 'center' }}>
                      Something went wrong. Try again.
                    </p>
                  )}
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
