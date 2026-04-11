import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [url, setUrl] = useState('');
  const [demoStatus, setDemoStatus] = useState(null); // null | 'error' | 'loading' | 'done'

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  function fakeGenerate() {
    if (!url.trim()) {
      setDemoStatus('error');
      setTimeout(() => setDemoStatus(null), 1200);
      return;
    }
    setDemoStatus('loading');
    setTimeout(() => setDemoStatus('done'), 1800);
  }

  const tickerItems = [
    'YouTube Videos', 'Podcasts', 'Livestreams', 'Audio Files',
    'Webinars', 'Interviews', 'Courses',
  ];

  return (
    <>
      <Head>
        <title>Clipr — One recording. A week of content.</title>
        <meta name="description" content="Turn any video or audio recording into a full week of content. Transcripts, carousels, tweet threads, blog outlines, and more — in under 60 seconds." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400&family=DM+Mono:wght@400&display=swap" rel="stylesheet" />
      </Head>

      {/* NAV */}
      <nav className={`nav${scrolled ? ' scrolled' : ''}`}>
        <a href="#" className="logo">clip<span>r</span></a>
        <ul className="nav-links">
          <li><a href="#how-it-works">How it works</a></li>
          <li><a href="#what-you-get">What you get</a></li>
          <li><a href="#pricing">Pricing</a></li>
          <li><a href="#" className="nav-cta">Try free →</a></li>
        </ul>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-glow" />
        <p className="hero-tag">// AI content repurposing</p>
        <h1>One recording.<br /><em>A week</em> of content.</h1>
        <p className="hero-sub">
          Paste a YouTube link, podcast URL, or upload a file. Clipr extracts your
          best ideas and generates a full content kit — ready to publish.
        </p>
        <div className="hero-actions">
          <a href="#" className="btn-primary">Start for free →</a>
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
              onKeyDown={(e) => e.key === 'Enter' && fakeGenerate()}
            />

            {demoStatus === 'loading' && (
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.8rem', color: 'var(--accent)' }}>
                ⚡ Generating your kit...
              </p>
            )}
            {demoStatus === 'done' && (
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.8rem', color: 'var(--accent2)' }}>
                ✓ Kit ready — sign up to view
              </p>
            )}
            {demoStatus === 'error' && (
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.8rem', color: 'var(--accent2)' }}>
                ↑ Drop a URL first
              </p>
            )}

            <button className="drop-btn" onClick={fakeGenerate}>
              Generate my content kit
            </button>

            <div className="output-cards">
              {['transcript', 'carousel', 'tweet thread', 'hook', 'blog outline', 'hashtags'].map((item) => (
                <span key={item} className="output-pill">{item}</span>
              ))}
            </div>
          </div>
        </div>
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
          <div className="stat-num">6</div>
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
        <h2>Three steps.<br />Zero effort.</h2>
        <div className="steps">
          <div className="step">
            <div className="step-num">01</div>
            <h3>Drop your recording</h3>
            <p>Paste a YouTube URL, podcast link, or upload an audio or video file. We handle any format.</p>
          </div>
          <div className="step">
            <div className="step-num">02</div>
            <h3>Clipr processes it</h3>
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
          <h2>Everything you need.<br />Nothing you don&apos;t.</h2>
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
        <h2>Built for people<br />who make things.</h2>
        <div className="testi-grid">
          <div className="testi-card">
            <p className="testi-text">
              &ldquo;I record one long podcast per week and used to spend Sunday afternoon manually clipping content. Clipr cut that to about 10 minutes. It&apos;s genuinely changed my workflow.&rdquo;
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
              &ldquo;As a solo founder, I wear too many hats. Clipr is like having a content team for $19 a month. I feed it my webinar recordings and it handles the rest.&rdquo;
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
              <button className="price-btn">Get started free</button>
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
              <button className="price-btn">Start Pro free for 7 days</button>
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
              <button className="price-btn">Try Teams free</button>
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
          <a href="#" className="btn-primary">Create free account →</a>
          <a href="#how-it-works" className="btn-ghost">Watch a demo</a>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <p>© 2026 Clipr. All rights reserved.</p>
        <ul className="nav-links">
          <li><a href="#">Privacy</a></li>
          <li><a href="#">Terms</a></li>
          <li><a href="#">Twitter</a></li>
          <li><a href="#">Contact</a></li>
        </ul>
      </footer>
    </>
  );
}
