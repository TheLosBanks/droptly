import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [url, setUrl] = useState('');
  const [demoStatus, setDemoStatus] = useState(null);
  const [demoError, setDemoError] = useState(null);
  const [kit, setKit] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [waitlistStatus, setWaitlistStatus] = useState(null); // null | 'loading' | 'done' | 'error'
  const [activeTab, setActiveTab] = useState('carousel');

  function openModal(e) {
    e.preventDefault();
    setModalOpen(true);
    setWaitlistStatus(null);
    setEmail('');
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
        setWaitlistStatus('done');
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
      try {
        data = await res.json();
      } catch {
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
    } catch {
      setDemoStatus('error');
      setDemoError('Connection error. Try again.');
    }
  }

  const tickerItems = [
    'YouTube Videos', 'Podcasts', 'Livestreams', 'Audio Files',
    'Webinars', 'Interviews', 'Courses',
  ];

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

        {/* DROP DEMO */}
        <div
          className="drop-demo"
          style={demoStatus === 'error' ? { borderColor: 'var(--accent2)' } : {}}
        >
          <div className="drop-inner">
            <div className="drop-icon">🎙</div>
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
                ↑ {demoError || 'Drop a URL first'}
              </p>
            )}

            <button className="drop-btn" onClick={generate} disabled={demoStatus === 'loading'}>
              {demoStatus === 'loading' ? 'Processing...' : 'Generate my content kit'}
            </button>

            <div className="output-cards">
              {['transcript', 'carousel', 'tweet thread', 'hook', 'shorts scripts', 'blog outline', 'hashtags'].map((item) => (
                <span key={item} className="output-pill">{item}</span>
              ))}
            </div>
          </div>
        </div>
      {/* KIT PREVIEW */}
      {kit && (
        <div className="kit-preview">
          <p className="section-label" style={{ textAlign: 'center', marginBottom: '0.5rem' }}>// your content kit</p>
          <p className="kit-summary">{kit.summary}</p>

          {/* TABS */}
          <div className="kit-tabs">
            {[
              { id: 'carousel', label: 'Carousel' },
              { id: 'tweets', label: 'Tweets' },
              { id: 'hooks', label: 'Hooks' },
              { id: 'shorts', label: 'Shorts Scripts' },
            ].map((tab) => (
              <button
                key={tab.id}
                className={`kit-tab${activeTab === tab.id ? ' active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB CONTENT */}
          <div className="kit-tab-content">
            {activeTab === 'carousel' && kit.carousel && (
              <div className="kit-tab-panel">
                {kit.carousel.slice(0, 2).map((slide, i) => (
                  <div key={i} className="kit-card">
                    <div className="kit-card-label">Slide {slide.slide || i + 1}</div>
                    <div className="kit-card-headline">{slide.headline}</div>
                    <p className="kit-card-body">{slide.body}</p>
                  </div>
                ))}
                {kit.carousel.length > 2 && (
                  <div className="kit-gate-inline">+ {kit.carousel.length - 2} more slides in full kit</div>
                )}
              </div>
            )}

            {activeTab === 'tweets' && kit.tweets && (
              <div className="kit-tab-panel">
                {kit.tweets.slice(0, 3).map((tweet, i) => (
                  <div key={i} className="kit-card">
                    <div className="kit-card-label">Tweet {i + 1}</div>
                    <p className="kit-card-body">{tweet}</p>
                  </div>
                ))}
                {kit.tweets.length > 3 && (
                  <div className="kit-gate-inline">+ {kit.tweets.length - 3} more tweets in full kit</div>
                )}
              </div>
            )}

            {activeTab === 'hooks' && kit.hooks && (
              <div className="kit-tab-panel">
                {kit.hooks.map((hook, i) => (
                  <div key={i} className="kit-card">
                    <div className="kit-card-label">Hook Variant {i + 1}</div>
                    <p className="kit-card-body">{hook}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'shorts' && kit.shorts && (
              <div className="kit-tab-panel">
                {kit.shorts.slice(0, 2).map((short, i) => (
                  <div key={i} className="kit-card">
                    <div className="kit-card-label">Short Script {i + 1}</div>
                    <div className="kit-card-headline">{short.title}</div>
                    <p className="kit-card-body" style={{ fontStyle: 'italic', opacity: 0.85 }}>&ldquo;{short.hook}&rdquo;</p>
                    <p className="kit-card-body" style={{ fontSize: '0.8rem', opacity: 0.6 }}>🎵 {short.audio_style}</p>
                  </div>
                ))}
                {kit.shorts.length > 2 && (
                  <div className="kit-gate-inline">+ {kit.shorts.length - 2} more Short scripts in full kit</div>
                )}
              </div>
            )}
          </div>

          <div className="kit-gate">
            <p>Full scripts, blog outline, transcript, hashtag sets, and all slides unlocked in full kit.</p>
            <a href="#" className="btn-primary" onClick={openModal}>Get your full kit →</a>
          </div>
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
            <h3>Drop your recording</h3>
            <p>Paste a YouTube URL, podcast link, or upload an audio or video file. We handle any format.</p>
          </div>
          <div className="step">
            <div className="step-num">02</div>
            <h3>Droptly processes it</h3>
            <p>Our AI transcribes, analyzes, and extracts the key insights, quotes, and takeaways from your content.</p>
          </div>
          <div className="step">
            <div className="step-num">03</div>
            <h3>Download your kit</h3>
            <p>Get a complete content kit — carousel copy, tweet threads, hooks, outlines, and hashtags — ready to publish.</p>
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
        <div className="hero-actions" style={{ justifyContent: 'center' }}>
          <a href="#" className="btn-primary" onClick={openModal}>Join the waitlist →</a>
          <a href="#how-it-works" className="btn-ghost">Watch a demo</a>
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
              </div>
            ) : (
              <>
                <p className="hero-tag" style={{ marginBottom: '1rem' }}>// early access</p>
                <h3 className="modal-title">Join the waitlist</h3>
                <p className="modal-sub">Be first to know when Droptly launches. No spam — one email when we&apos;re live.</p>
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
