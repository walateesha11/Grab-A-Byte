import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Marquee from '../components/Marquee';
import './Home.css';

// Register GSAP plugin once at module level
gsap.registerPlugin(ScrollTrigger);

const MENU_PREVIEW = [
  { name: 'SMASH BURGER',     price: '₹299', img: '/images/burger-cute.png', tag: 'BESTSELLER' },
  { name: 'MARGHERITA PIZZA', price: '₹249', img: '/images/pizza-cute.png',  tag: 'VEG' },
  { name: 'LOADED FRIES',     price: '₹149', img: '/images/fries-cute.png',  tag: 'CRISPY' },
  { name: 'SPICY HOTDOG',     price: '₹189', img: '/images/hotdog-cute.png', tag: 'SPICY 🌶' },
  { name: 'GLAZED DONUT',     price: '₹99',  img: '/images/donut-float.png', tag: 'SWEET' },
  { name: 'VEGGIE SALAD',     price: '₹179', img: '/images/salad-cute.png',  tag: 'HEALTHY' },
];

const ACID_PROPS = [
  { letter: 'A', name: 'ATOMICITY',   desc: 'All or nothing. Every order completes fully or rolls back — zero partial states ever committed.' },
  { letter: 'C', name: 'CONSISTENCY', desc: 'FK constraints, CHECK rules & triggers enforce data integrity at every write.' },
  { letter: 'I', name: 'ISOLATION',   desc: 'REPEATABLE READ + SELECT FOR UPDATE blocks all dirty reads and phantom anomalies.' },
  { letter: 'D', name: 'DURABILITY',  desc: 'InnoDB redo logs guarantee crash-safe persistence for every committed transaction.' },
];

export default function Home() {
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {

      // ── Sticky parallax pinning — all panels except the last ──
      const panels = gsap.utils.toArray('.gb-panel');
      panels.forEach((panel, i) => {
        if (i < panels.length - 1) {
          ScrollTrigger.create({
            trigger: panel,
            start: 'top top',
            pin: true,
            pinSpacing: false,
          });
        }
      });

      // ── Panel 1: Hero entrance timeline ──
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
      tl
        .from('.gb-watermark',   { scale: 1.15, opacity: 0, duration: 1.4 })
        .from('.gb-title-line',  { y: 160, opacity: 0, rotateZ: 4, stagger: 0.13, duration: 0.95 }, '-=1')
        .from('.gb-tag-badge',   { y: 20, opacity: 0, duration: 0.5 }, '-=0.4')
        .from('.gb-fresh-badge', { scale: 0, rotation: -45, opacity: 0, duration: 0.7, ease: 'back.out(2.2)' }, '-=0.4')
        .from('.polaroid',       { scale: 0, opacity: 0, rotation: 25, stagger: 0.1, duration: 0.65, ease: 'back.out(1.8)' }, '-=0.5')
        .from('.gb-sticker',     { scale: 0, opacity: 0, stagger: 0.09, duration: 0.5, ease: 'back.out(2)' }, '-=0.5')
        .from('.gb-hero-cta',    { y: 30, opacity: 0, duration: 0.5 }, '-=0.3');

      // Gentle sticker float
      const stickers = gsap.utils.toArray('.gb-sticker');
      if (stickers.length) {
        stickers.forEach((el, i) => {
          gsap.to(el, { y: -12, duration: 2.2 + i * 0.3, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: i * 0.35 });
        });
      }

      // ── Panel 2: ACID entrance ──
      if (document.querySelector('.acid-headline')) {
        gsap.from('.acid-headline span', {
          scrollTrigger: { trigger: '.acid-panel', start: 'top 65%' },
          x: -80, opacity: 0, stagger: 0.15, duration: 0.7,
        });
        gsap.from('.acid-tagline', {
          scrollTrigger: { trigger: '.acid-panel', start: 'top 65%' },
          y: 30, opacity: 0, duration: 0.6, delay: 0.3,
        });
        gsap.from('.acid-card', {
          scrollTrigger: { trigger: '.acid-panel', start: 'top 65%' },
          y: 70, opacity: 0, stagger: 0.1, duration: 0.65, ease: 'back.out(1.6)', delay: 0.2,
        });
        gsap.from('.acid-terminal', {
          scrollTrigger: { trigger: '.acid-panel', start: 'top 65%' },
          x: 80, opacity: 0, duration: 0.8, delay: 0.3,
        });
        gsap.from('.acid-stat', {
          scrollTrigger: { trigger: '.acid-panel', start: 'top 65%' },
          y: 30, opacity: 0, stagger: 0.1, duration: 0.5, delay: 0.5,
        });
      }

      // ── Panel 3: Menu entrance ──
      if (document.querySelector('.menu-panel')) {
        gsap.from('.menu-headline', {
          scrollTrigger: { trigger: '.menu-panel', start: 'top 65%' },
          x: -80, opacity: 0, duration: 0.7,
        });
        gsap.from('.menu-card', {
          scrollTrigger: { trigger: '.menu-panel', start: 'top 65%' },
          scale: 0.85, opacity: 0, stagger: 0.07, duration: 0.5, ease: 'back.out(1.7)', delay: 0.2,
        });
      }

      // ── Panel 4: Admin entrance + counters ──
      if (document.querySelector('.admin-panel')) {
        gsap.from('.admin-headline', {
          scrollTrigger: { trigger: '.admin-panel', start: 'top 65%' },
          y: -50, opacity: 0, duration: 0.7,
        });
        gsap.from('.admin-metric', {
          scrollTrigger: { trigger: '.admin-panel', start: 'top 65%' },
          y: 60, opacity: 0, stagger: 0.12, duration: 0.6, ease: 'back.out(1.5)', delay: 0.2,
        });

        // Number counters
        [{ sel: '#counter-orders', end: 45 }, { sel: '#counter-users', end: 1240 }].forEach(({ sel, end }) => {
          const obj = { val: 0 };
          gsap.to(obj, {
            scrollTrigger: { trigger: '.admin-panel', start: 'top 65%' },
            val: end, duration: 1.8, ease: 'power2.out', delay: 0.3,
            onUpdate() {
              const el = document.querySelector(sel);
              if (el) el.textContent = Math.round(obj.val).toLocaleString();
            },
          });
        });
      }

      // ── Panel 5: Footer entrance ──
      if (document.querySelector('.footer-panel')) {
        gsap.from('.footer-headline', {
          scrollTrigger: { trigger: '.footer-panel', start: 'top 80%' },
          y: 70, opacity: 0, duration: 0.8,
        });
        gsap.from('.footer-sub, .footer-main-cta, .footer-nav, .footer-credit', {
          scrollTrigger: { trigger: '.footer-panel', start: 'top 80%' },
          y: 40, opacity: 0, stagger: 0.1, duration: 0.6, delay: 0.3,
        });
      }


    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="gb-home">

      {/* ══════════════════════════════════════════════
          PANEL 1 — GROOVY HERO  (Lime Green)
          ══════════════════════════════════════════════ */}
      <section className="gb-panel hero-panel" id="hero">
        {/* Giant background watermark */}
        <div className="gb-watermark" aria-hidden="true">gb</div>

        {/* ── Polaroids — pinned to panel corners, never touching the centre ── */}
        <div className="polaroid polaroid-1" aria-hidden="true">
          <img src="/images/burger-cute.png" alt="Smash Burger" />
          <span className="polaroid-caption">smash burger</span>
        </div>
        <div className="polaroid polaroid-2" aria-hidden="true">
          <img src="/images/pizza-cute.png" alt="Margherita Pizza" />
          <span className="polaroid-caption">margherita</span>
        </div>
        <div className="polaroid polaroid-3" aria-hidden="true">
          <img src="/images/fries-cute.png" alt="Loaded Fries" />
          <span className="polaroid-caption">loaded fries</span>
        </div>
        <div className="polaroid polaroid-4" aria-hidden="true">
          <img src="/images/hotdog-cute.png" alt="Spicy Hotdog" />
          <span className="polaroid-caption">spicy hotdog</span>
        </div>
        <div className="polaroid polaroid-5" aria-hidden="true">
          <img src="/images/donut-float.png" alt="Glazed Donut" />
          <span className="polaroid-caption">glazed donut</span>
        </div>

        {/* ── Small floating stickers ── */}
        <img src="/images/pizza-float.png" className="gb-sticker sticker-s1" alt="" aria-hidden="true" />
        <img src="/images/fries-float.png" className="gb-sticker sticker-s2" alt="" aria-hidden="true" />
        <img src="/images/cake-cute.png"   className="gb-sticker sticker-s3" alt="" aria-hidden="true" />
        <img src="/images/donut-float.png" className="gb-sticker sticker-s4" alt="" aria-hidden="true" />

        {/* ── 100% Fresh rotating badge ── */}
        <div className="gb-fresh-badge" aria-label="100% Fresh">
          <span>100%<br />FRESH</span>
        </div>

        {/* ── CENTRE COLUMN — badge + single-line title + CTAs ── */}
        <div className="gb-hero-center">
          <div className="gb-tag-badge">🚀 #1 DBMS-POWERED FOOD DELIVERY</div>
          <h1 className="gb-hero-title">GRAB A BYTE.</h1>
          <div className="gb-hero-cta">
            <Link to="/menu" className="brutal-btn black" id="hero-order-btn">ORDER NOW →</Link>
            <Link to="/about" className="gb-ghost-btn" id="hero-about-btn">HOW IT WORKS</Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          PANEL 2 — ACID COMPLIANCE  (Forest Green)
          ══════════════════════════════════════════════ */}
      <section className="gb-panel acid-panel" id="acid">
        <div className="acid-content">

          {/* Top row: headline + tagline + sticker */}
          <div className="acid-top">
            <h2 className="acid-headline">
              <span className="acid-word-1">ACID</span>
              <span className="acid-word-2">COMPLIANCE</span>
            </h2>
            <p className="acid-tagline">
              Powered by ACID-compliant MySQL transactions.<br />
              Every order is <strong>atomic</strong>. Every bite is <strong>consistent</strong>.
            </p>
            <div className="acid-fresh-sticker" aria-hidden="true">100%<br />FRESH</div>
          </div>

          {/* Body: 2×2 ACID cards + terminal/stats */}
          <div className="acid-body">
            <div className="acid-cards-grid">
              {ACID_PROPS.map(({ letter, name, desc }) => (
                <div className="acid-card" key={letter}>
                  <span className="acid-card-letter">{letter}</span>
                  <div>
                    <h3 className="acid-card-name">{name}</h3>
                    <p className="acid-card-desc">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="acid-right-col">
              {/* MySQL terminal */}
              <div className="acid-terminal">
                <div className="terminal-bar">
                  <span className="terminal-dot red" />
                  <span className="terminal-dot yellow" />
                  <span className="terminal-dot green" />
                  <span className="terminal-title">mysql&gt;</span>
                </div>
                <div className="terminal-body">
                  <code className="terminal-line"><span className="sql-kw">START TRANSACTION</span>;</code>
                  <code className="terminal-line"><span className="sql-kw">CALL</span> PlaceSecureOrder();</code>
                  <code className="terminal-line terminal-comment">-- acquiring row-level lock</code>
                  <code className="terminal-line"><span className="sql-kw">UPDATE</span> inventory <span className="sql-kw">SET</span> stock = stock-1;</code>
                  <code className="terminal-line terminal-comment">-- FK inserts, triggers fire</code>
                  <code className="terminal-line terminal-result">→ <span className="sql-ok">COMMIT</span> ✓</code>
                </div>
              </div>

              {/* Stats strip */}
              <div className="acid-stats">
                <div className="acid-stat"><span className="acid-stat-val">0</span><span className="acid-stat-lbl">RACE CONDITIONS</span></div>
                <div className="acid-stat"><span className="acid-stat-val">100%</span><span className="acid-stat-lbl">ATOMIC ORDERS</span></div>
                <div className="acid-stat"><span className="acid-stat-val">∞</span><span className="acid-stat-lbl">CONSISTENT BITES</span></div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════
          PANEL 3 — MENU PREVIEW  (Bright Orange)
          ══════════════════════════════════════════════ */}
      <section className="gb-panel menu-panel" id="menu-preview">
        <div className="menu-content">
          <div className="menu-header-row">
            <h2 className="menu-headline">POP<br />MENU</h2>
            <div className="menu-header-info">
              <p className="menu-sub">GROOVY MEALS. BRUTALIST PRICES.</p>
              <Link to="/menu" className="brutal-btn black" id="menu-viewall-btn">VIEW ALL →</Link>
            </div>
          </div>
          <div className="menu-grid">
            {MENU_PREVIEW.map((item, i) => (
              <div className="menu-card" key={i} id={`mcard-${i}`}>
                <span className="menu-card-tag">{item.tag}</span>
                <img src={item.img} alt={item.name} className="menu-card-img" />
                <div className="menu-card-body">
                  <h3 className="menu-card-name">{item.name}</h3>
                  <div className="menu-card-footer">
                    <span className="menu-card-price">{item.price}</span>
                    <Link to="/menu" className="menu-card-btn" id={`mcard-btn-${i}`}>ORDER</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          PANEL 4 — ADMIN DASHBOARD  (Black)
          ══════════════════════════════════════════════ */}
      <section className="gb-panel admin-panel" id="admin-preview">
        <div className="admin-content">
          <div className="admin-header">
            <span className="admin-eyebrow">■ LIVE DATABASE METRICS</span>
            <h2 className="admin-headline">ADMIN DB<br />DASHBOARD</h2>
            <p className="admin-sub">Real-time data from the GrabAByte MySQL backend.</p>
          </div>

          <div className="admin-body">
            <div className="admin-metrics-row">
              <div className="admin-metric" id="admin-metric-orders">
                <span className="admin-metric-val" id="counter-orders">0</span>
                <span className="admin-metric-lbl">ACTIVE ORDERS</span>
                <div className="admin-bar"><div className="admin-bar-fill" style={{ width: '72%' }} /></div>
              </div>
              <div className="admin-metric" id="admin-metric-users">
                <span className="admin-metric-val" id="counter-users">0</span>
                <span className="admin-metric-lbl">REGISTERED USERS</span>
                <div className="admin-bar"><div className="admin-bar-fill" style={{ width: '88%' }} /></div>
              </div>
              <div className="admin-metric" id="admin-metric-uptime">
                <span className="admin-metric-val">99.9<span className="admin-denom">%</span></span>
                <span className="admin-metric-lbl">SYSTEM UPTIME</span>
                <div className="admin-bar"><div className="admin-bar-fill" style={{ width: '99%' }} /></div>
              </div>
            </div>

            <Link to="/dashboard" className="brutal-btn green" id="admin-dash-btn">VIEW DASHBOARD →</Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          PANEL 5 — FOOTER  (Hot Pink) — NOT PINNED
          ══════════════════════════════════════════════ */}
      <section className="gb-panel footer-panel" id="footer">
        <div className="gb-footer-inner">
          <h2 className="footer-headline">HUNGRY<br />YET?</h2>
          <p className="footer-sub">YOUR NEXT MEAL IS ONE CLICK AWAY.</p>
          <Link to="/menu" className="brutal-btn black footer-main-cta" id="footer-explore-btn">
            EXPLORE MENU →
          </Link>
          <nav className="footer-nav" aria-label="Footer navigation">
            <Link to="/"          className="footer-nav-link">HOME</Link>
            <Link to="/menu"      className="footer-nav-link">MENU</Link>
            <Link to="/about"     className="footer-nav-link">ABOUT</Link>
            <Link to="/schema"    className="footer-nav-link">SCHEMA</Link>
            <Link to="/login"     className="footer-nav-link">LOGIN</Link>
            <Link to="/dashboard" className="footer-nav-link">ADMIN</Link>
          </nav>
          <p className="footer-credit">GrabAByte v1.0 — DBMS Mini Project — MySQL + React</p>
        </div>

        <Marquee text="ACID • CONCURRENCY CONTROL • SECURE PAYMENTS • DBMS MINI PROJECT • 370 GLYPHS * • &nbsp;&nbsp;&nbsp;" />
      </section>

    </div>
  );
}
