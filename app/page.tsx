"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";

const WEDDING_DATE = new Date("2026-07-05T10:00:00+05:30");
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const C = {
  bg:        "#fcfbf9",
  bgAlt:     "#f5f8f6",
  dark:      "#2c3e38",
  accent:    "#d8406b",
  secondary: "#5a6b65",
  text:      "#4a5a54",
  border:    "#d4e0db",
  gold:      "#C4922A",
  white:     "#ffffff",
} as const;

// ─── Hooks ────────────────────────────────────────────────────────────
function useCountdown() {
  const [t, setT] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const tick = () => {
      const d = WEDDING_DATE.getTime() - Date.now();
      if (d <= 0) return;
      setT({
        days:    Math.floor(d / 86400000),
        hours:   Math.floor((d % 86400000) / 3600000),
        minutes: Math.floor((d % 3600000) / 60000),
        seconds: Math.floor((d % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add("in"); obs.unobserve(el); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useReveal();
  return (
    <div ref={ref} className="reveal" style={delay ? { transitionDelay: `${delay}ms` } : undefined}>
      {children}
    </div>
  );
}

// ─── Falling Flowers & Leaves Canvas ─────────────────────────────────
type Particle = {
  x: number; y: number;
  vx: number; vy: number;
  rotation: number; rotSpeed: number;
  size: number; alpha: number;
  kind: "petal" | "leaf";
  color: string;
  wobble: number; wobbleSpeed: number;
};

const PETAL_COLORS = [
  "#C4922A", "#DEB84A", "#E8C870",
  "#C41E3A", "#D4686A",
  "#FFF5DC",
];
const LEAF_COLORS = ["#5A8A50", "#6FAD5A", "#7AB060"];

function FallingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const parts     = useRef<Particle[]>([]);
  const rafRef    = useRef<number>(0);
  const tick      = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext("2d")!;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const spawn = (x?: number, y?: number): Particle => {
      const isLeaf = Math.random() < 0.28;
      return {
        x: x ?? Math.random() * canvas.width,
        y: y ?? -25,
        vx: (Math.random() - 0.5) * 0.9,
        vy: Math.random() * 1.1 + 0.45,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.045,
        size: isLeaf ? Math.random() * 14 + 9 : Math.random() * 10 + 6,
        alpha: Math.random() * 0.55 + 0.25,
        kind: isLeaf ? "leaf" : "petal",
        color: isLeaf
          ? LEAF_COLORS[Math.floor(Math.random() * LEAF_COLORS.length)]
          : PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)],
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: Math.random() * 0.035 + 0.01,
      };
    };

    for (let i = 0; i < 30; i++) {
      parts.current.push(spawn(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
      ));
    }

    const draw = (p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.alpha;

      if (p.kind === "leaf") {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.bezierCurveTo( p.size * 0.55, -p.size * 0.4,  p.size * 0.55, p.size * 0.4, 0, p.size);
        ctx.bezierCurveTo(-p.size * 0.55,  p.size * 0.4, -p.size * 0.55, -p.size * 0.4, 0, -p.size);
        ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,0.18)";
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(0, -p.size * 0.82);
        ctx.lineTo(0,  p.size * 0.82);
        ctx.stroke();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 0.42, p.size, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    };

    const loop = () => {
      tick.current++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (tick.current % 50 === 0 && parts.current.length < 55) {
        parts.current.push(spawn());
      }

      parts.current = parts.current.filter(p => p.y < canvas.height + 35);

      for (const p of parts.current) {
        p.wobble   += p.wobbleSpeed;
        p.x        += p.vx + Math.sin(p.wobble) * 0.45;
        p.y        += p.vy;
        p.rotation += p.rotSpeed;
        draw(p);
      }

      rafRef.current = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 50 }}
    />
  );
}

// ─── TopBar ───────────────────────────────────────────────────────────
function TopBar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > window.innerHeight * 0.6);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 40,
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "14px 28px",
      background: scrolled ? "rgba(252,251,249,0.92)" : "transparent",
      backdropFilter: scrolled ? "blur(10px)" : "none",
      transition: "background 0.4s, border-color 0.4s",
      borderBottom: scrolled ? `1px solid ${C.border}` : "1px solid transparent",
    }}>
      <div style={{
        fontFamily: "var(--font-playfair)", fontStyle: "italic",
        fontSize: 18, color: C.dark,
        opacity: scrolled ? 1 : 0, transition: "opacity 0.4s",
      }}>
        Arun &amp; Ashwati
      </div>
      <button
        aria-label="Music"
        style={{
          width: 38, height: 38, borderRadius: "50%",
          border: `1px solid ${scrolled ? C.border : "rgba(255,255,255,0.4)"}`,
          background: scrolled ? C.white : "rgba(255,255,255,0.15)",
          backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
          color: scrolled ? C.secondary : "rgba(255,255,255,0.85)",
          transition: "all 0.4s",
        }}>
        <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 15, height: 15 }}>
          <path d="M9 18V5l12-2v13M9 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2Zm12 0c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2Z"/>
        </svg>
      </button>
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────
const DATE_STR = "5  ·  7  ·  2 0 2 6";

function Hero() {
  return (
    <header style={{
      position: "relative",
      height: "100dvh", minHeight: 620,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      overflow: "hidden", background: "#2c3e38",
    }}>
      {/* Photo */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <Image
          src={`${BASE}/hero-bg.jpg`}
          alt=""
          fill
          priority
          unoptimized
          style={{ objectFit: "cover", objectPosition: "center 25%", opacity: 0.55 }}
        />
      </div>
      {/* Gradient overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to bottom, rgba(44,62,56,0.35) 0%, rgba(44,62,56,0.1) 45%, rgba(44,62,56,0.45) 100%)",
      }} />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 2, textAlign: "center", padding: "0 28px" }}>
        <h1 className="mangalyam">മംഗല്യം</h1>
        <div className="hero-names">Arun &amp; Ashwati</div>
        <div className="hero-date">
          {DATE_STR.split("").map((ch, i) => (
            <span
              key={i}
              className="date-char"
              style={{ animationDelay: `${1.8 + i * 0.07}s` }}
            >
              {ch === " " ? " " : ch}
            </span>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div style={{
        position: "absolute", bottom: 36, zIndex: 2,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
      }}>
        <span style={{
          fontFamily: "var(--font-outfit)", fontSize: 10,
          letterSpacing: "0.3em", textTransform: "uppercase",
          color: "rgba(255,255,255,0.6)",
        }}>Scroll</span>
        <svg
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
          style={{ width: 22, height: 22, color: "rgba(255,255,255,0.65)" }}
          className="bounce-arrow"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </header>
  );
}

// ─── Celebration ─────────────────────────────────────────────────────
function Celebration() {
  const { days, hours, minutes, seconds } = useCountdown();

  return (
    <section style={{ background: C.bg, padding: "100px 32px 80px" }}>
      <div style={{ maxWidth: 1160, margin: "0 auto" }}>
        <div className="celebration-grid">

          {/* Left column */}
          <div>
            <Reveal>
              <div style={{
                fontFamily: "var(--font-outfit)", fontSize: 11,
                letterSpacing: "0.32em", textTransform: "uppercase",
                color: C.accent, marginBottom: 20,
              }}>The Celebration</div>
              <h2 style={{
                fontFamily: "var(--font-playfair)", fontWeight: 600,
                fontSize: "clamp(40px, 7vw, 62px)",
                color: C.dark, lineHeight: 1.1, margin: "0 0 24px",
              }}>
                Arun &amp; Ashwati
              </h2>
              <p style={{
                fontFamily: "var(--font-outfit)", fontWeight: 300,
                fontSize: 17, lineHeight: 1.8,
                color: C.text, maxWidth: "44ch", margin: "0 0 48px",
              }}>
                Two hearts, one journey. We invite you to join us as we celebrate
                this beautiful beginning, surrounded by everyone we love.
              </p>
            </Reveal>

            {/* Date & Location cards */}
            <div className="detail-grid">
              <Reveal delay={80}>
                <div style={{
                  padding: "24px 20px",
                  border: `1px solid ${C.border}`, borderRadius: 14,
                  background: C.white,
                }}>
                  <div style={{
                    fontFamily: "var(--font-outfit)", fontSize: 10,
                    letterSpacing: "0.25em", textTransform: "uppercase",
                    color: C.accent, marginBottom: 10,
                  }}>Date &amp; Time</div>
                  <div style={{
                    fontFamily: "var(--font-playfair)", fontSize: 22,
                    color: C.dark, marginBottom: 5, lineHeight: 1.2,
                  }}>5 July 2026</div>
                </div>
              </Reveal>
              <Reveal delay={160}>
                <div style={{
                  padding: "24px 20px",
                  border: `1px solid ${C.border}`, borderRadius: 14,
                  background: C.white,
                }}>
                  <div style={{
                    fontFamily: "var(--font-outfit)", fontSize: 10,
                    letterSpacing: "0.25em", textTransform: "uppercase",
                    color: C.accent, marginBottom: 10,
                  }}>Venue</div>
                  <div style={{
                    fontFamily: "var(--font-playfair)", fontSize: 22,
                    color: C.dark, marginBottom: 5, lineHeight: 1.2,
                  }}>Guruvayoor Temple</div>
                  <div style={{
                    fontFamily: "var(--font-outfit)", fontSize: 14,
                    color: C.secondary, marginBottom: 10,
                  }}>Guruvayoor, Kerala</div>
                </div>
              </Reveal>
            </div>

            {/* Countdown */}
            <Reveal delay={240}>
              <div style={{ marginTop: 48 }}>
                <div style={{
                  fontFamily: "var(--font-outfit)", fontSize: 10,
                  letterSpacing: "0.28em", textTransform: "uppercase",
                  color: C.secondary, marginBottom: 20,
                }}>Counting Down To</div>
                <div style={{ display: "flex", gap: 32 }}>
                  {[
                    { v: days,    l: "Days"  },
                    { v: hours,   l: "Hours" },
                    { v: minutes, l: "Mins"  },
                    { v: seconds, l: "Secs"  },
                  ].map(({ v, l }) => (
                    <div key={l}>
                      <div style={{
                        fontFamily: "var(--font-playfair)", fontWeight: 600,
                        fontSize: 42, color: C.dark, lineHeight: 1,
                      }}>{String(v).padStart(2, "0")}</div>
                      <div style={{
                        fontFamily: "var(--font-outfit)", fontSize: 10,
                        letterSpacing: "0.2em", textTransform: "uppercase",
                        color: C.secondary, marginTop: 6,
                      }}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>

          {/* Right column — polaroid photo */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Reveal delay={200}>
              <div className="polaroid-card">
                <div style={{
                  width: "100%",
                  background: "#d8d0c4",
                  overflow: "hidden",
                  aspectRatio: "4 / 5",
                  position: "relative",
                }}>
                  <Image
                    src={`${BASE}/aa.jpeg`}
                    alt="Arun &amp; Ashwati"
                    fill
                    unoptimized
                    style={{ objectFit: "cover" }}
                  />
                </div>
                <div style={{
                  fontFamily: "var(--font-great-vibes)",
                  fontSize: 30, color: C.dark,
                  textAlign: "center", padding: "12px 0 6px",
                  lineHeight: 1,
                }}>
                  Arun &amp; Ashwati
                </div>
              </div>
            </Reveal>
          </div>

        </div>
      </div>
    </section>
  );
}

// ─── Events ───────────────────────────────────────────────────────────
const EVENTS = [
  {
    title: "Wedding Ceremony",
    date:  "July 5, 2026",
    time:  "Between 7:45 AM and 8:15 AM",
    venue: "Guruvayoor Temple, Kerala",
    mapUrl: "https://maps.app.goo.gl/AJkbkpwKrfoxFpDh7",
  },
  {
    title: "Sadya",
    date:  "July 5, 2026",
    time:  "Marriage ceremony followed by Sadhya",
    venue: "Hotel Pushpanjali,East Nada, Guruvayoor",
    mapUrl: "https://maps.app.goo.gl/AZWfjPNQYaw3b3EY9",
  },
  {
    title: "Reception",
    date:  "July 5, 2026",
    time:  "6:00 PM to 9:00 PM",
    venue: "St. Michael's Roman Catholic Latin Church Hall, Pothy",
    mapUrl: "https://maps.app.goo.gl/6wHCx15UiAQ64y1U9", // Replace with actual map URL
  },
];

function Events() {
  return (
    <section style={{ background: C.white, padding: "100px 32px" }}>
      <div style={{ maxWidth: 1160, margin: "0 auto" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <div style={{
              fontFamily: "var(--font-outfit)", fontSize: 11,
              letterSpacing: "0.32em", textTransform: "uppercase",
              color: C.accent, marginBottom: 16,
            }}>The Itinerary</div>
            <h2 style={{
              fontFamily: "var(--font-playfair)", fontWeight: 600,
              fontSize: "clamp(36px, 5vw, 52px)",
              color: C.dark, margin: 0,
            }}>Events</h2>
          </div>
        </Reveal>

        <div className="events-grid">
          {EVENTS.map((ev, i) => (
            <Reveal key={ev.title} delay={i * 100}>
              <div style={{
                textAlign: "center", padding: "40px 28px",
                border: `1px solid ${C.border}`, borderRadius: 16,
                background: C.bg,
                display: "flex", flexDirection: "column", alignItems: "center",
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: "50%",
                  background: "rgba(216,64,107,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 20,
                }}>
                  <svg viewBox="0 0 24 24" fill={C.accent} style={{ width: 22, height: 22 }}>
                    <path d="M12 21s-7.5-5-9.5-9.5C1 8 3 5 6 5c2 0 3 1.2 4 2.5C11 6.2 12 5 14 5c3 0 5 3 3.5 6.5C19.5 16 12 21 12 21Z" />
                  </svg>
                </div>
                <h3 style={{
                  fontFamily: "var(--font-playfair)", fontWeight: 600,
                  fontSize: 22, color: C.dark, margin: "0 0 8px",
                }}>{ev.title}</h3>
                <div style={{
                  fontFamily: "var(--font-outfit)", fontSize: 11,
                  letterSpacing: "0.2em", textTransform: "uppercase",
                  color: C.accent, marginBottom: 8,
                }}>{ev.date}</div>
                <div style={{
                  fontFamily: "var(--font-outfit)", fontSize: 15,
                  color: C.text, marginBottom: 4,
                }}>{ev.time}</div>
                <div style={{
                  fontFamily: "var(--font-outfit)", fontSize: 14,
                  color: C.secondary, marginBottom: 20,
                }}>{ev.venue}</div>
                <a
                  href={ev.mapUrl} target="_blank" rel="noopener noreferrer"
                  style={{
                    fontFamily: "var(--font-outfit)", fontSize: 11,
                    letterSpacing: "0.2em", textTransform: "uppercase",
                    color: C.accent, textDecoration: "none",
                    border: `1px solid ${C.accent}`,
                    padding: "7px 18px", borderRadius: 100,
                  }}
                >Open Map</a>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── RSVP ─────────────────────────────────────────────────────────────
function RSVP() {
  const [name, setName]         = useState("");
  const [attend, setAttend]     = useState<"yes" | "no" | null>(null);
  const [guests, setGuests]     = useState("1");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!name.trim() || !attend) return;
    setSubmitted(true);
  };

  return (
    <section style={{ background: C.bg, padding: "100px 32px" }}>
      <div style={{ maxWidth: 620, margin: "0 auto" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{
              fontFamily: "var(--font-outfit)", fontSize: 11,
              letterSpacing: "0.32em", textTransform: "uppercase",
              color: C.accent, marginBottom: 16,
            }}>Be Our Guest</div>
            <h2 style={{
              fontFamily: "var(--font-playfair)", fontWeight: 600,
              fontSize: "clamp(36px, 5vw, 52px)",
              color: C.dark, margin: "0 0 16px",
            }}>RSVP</h2>
            <p style={{
              fontFamily: "var(--font-outfit)", fontSize: 16,
              color: C.text, margin: 0,
            }}>Please let us know if you can join us.</p>
          </div>
        </Reveal>

        <Reveal delay={100}>
          {submitted ? (
            <div style={{
              textAlign: "center", padding: "52px 32px",
              background: C.white, borderRadius: 20,
              boxShadow: "0 4px 28px rgba(44,62,56,0.08)",
            }}>
              <div style={{
                fontFamily: "var(--font-playfair)", fontStyle: "italic",
                fontSize: 28, color: C.dark, marginBottom: 14,
              }}>
                {attend === "yes" ? `Thank you, ${name}!` : `Thank you, ${name}.`}
              </div>
              <p style={{
                fontFamily: "var(--font-outfit)", fontSize: 15,
                color: C.text, margin: 0,
              }}>
                {attend === "yes"
                  ? "We can't wait to celebrate with you!"
                  : "You'll be dearly missed."}
              </p>
            </div>
          ) : (
            <div style={{
              background: C.white, borderRadius: 20,
              boxShadow: "0 4px 28px rgba(44,62,56,0.08)",
              padding: "40px 36px",
            }}>
              {/* Name */}
              <div style={{ marginBottom: 22 }}>
                <label style={{
                  display: "block", marginBottom: 8,
                  fontFamily: "var(--font-outfit)", fontSize: 11,
                  letterSpacing: "0.22em", textTransform: "uppercase",
                  color: C.secondary,
                }}>Full Name</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  autoComplete="name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={{
                    width: "100%", padding: "13px 16px",
                    border: `1px solid ${C.border}`, borderRadius: 10,
                    fontFamily: "var(--font-outfit)", fontSize: 16,
                    color: C.dark, background: C.bg, outline: "none",
                    boxSizing: "border-box", transition: "border-color 0.2s",
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
                  onBlur={e  => (e.currentTarget.style.borderColor = C.border)}
                />
              </div>

              {/* Attend toggle */}
              <div style={{ marginBottom: 22 }}>
                <label style={{
                  display: "block", marginBottom: 8,
                  fontFamily: "var(--font-outfit)", fontSize: 11,
                  letterSpacing: "0.22em", textTransform: "uppercase",
                  color: C.secondary,
                }}>Will you attend?</label>
                <div style={{ display: "flex", gap: 12 }}>
                  {(["yes", "no"] as const).map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAttend(val)}
                      style={{
                        flex: 1, padding: "13px 8px",
                        border: `1px solid ${attend === val ? C.accent : C.border}`,
                        borderRadius: 10,
                        background: attend === val ? "rgba(216,64,107,0.07)" : "transparent",
                        fontFamily: "var(--font-outfit)", fontSize: 14,
                        color: attend === val ? C.accent : C.text,
                        cursor: "pointer", transition: "all 0.2s",
                        fontWeight: attend === val ? 500 : 400,
                      }}
                    >
                      {val === "yes" ? "Joyfully Accept" : "Regretfully Decline"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Guest count */}
              {attend === "yes" && (
                <div style={{ marginBottom: 22 }}>
                  <label style={{
                    display: "block", marginBottom: 8,
                    fontFamily: "var(--font-outfit)", fontSize: 11,
                    letterSpacing: "0.22em", textTransform: "uppercase",
                    color: C.secondary,
                  }}>Number of Guests</label>
                  <select
                    value={guests}
                    onChange={e => setGuests(e.target.value)}
                    style={{
                      width: "100%", padding: "13px 16px",
                      border: `1px solid ${C.border}`, borderRadius: 10,
                      fontFamily: "var(--font-outfit)", fontSize: 15,
                      color: C.dark, background: C.bg, outline: "none",
                      cursor: "pointer",
                    }}
                  >
                    {["1","2","3","4","5"].map(n => (
                      <option key={n} value={n}>{n} {n === "1" ? "Guest" : "Guests"}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Submit */}
              <button
                type="button"
                onClick={handleSubmit}
                style={{
                  width: "100%", padding: "16px",
                  background: C.dark, color: C.white,
                  border: "none", borderRadius: 10,
                  fontFamily: "var(--font-outfit)", fontSize: 13,
                  letterSpacing: "0.2em", textTransform: "uppercase",
                  cursor: "pointer", marginTop: 4,
                  transition: "background 0.2s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "#1d2e2a")}
                onMouseLeave={e => (e.currentTarget.style.background = C.dark)}
              >
                Send RSVP
              </button>
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{
      background: C.bg, textAlign: "center",
      padding: "72px 32px 90px",
      borderTop: `1px solid ${C.border}`,
    }}>
      <div style={{
        fontFamily: "var(--font-outfit)", fontSize: 12,
        letterSpacing: "0.3em", textTransform: "uppercase",
        color: C.secondary, marginBottom: 10,
      }}>
        A Journey of Love
      </div>
      <div style={{
        fontFamily: "var(--font-playfair)", fontStyle: "italic",
        fontSize: "clamp(34px, 6vw, 52px)",
        color: C.dark, marginBottom: 14,
      }}>
        Arun &amp; Ashwati
      </div>
      <div style={{
        fontFamily: "var(--font-outfit)", fontSize: 13,
        color: C.secondary, opacity: 0.6, marginBottom: 40,
      }}>
        5 · 7 · 2026
      </div>

      {/* Divider */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 10, margin: "0 auto 28px", maxWidth: 320,
      }}>
        <div style={{ flex: 1, height: 1, background: C.border }} />
        <div style={{ display: "flex", gap: 4 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              width: i === 1 ? 7 : 5, height: i === 1 ? 7 : 5,
              borderRadius: "50%", background: C.accent,
            }} />
          ))}
        </div>
        <div style={{ flex: 1, height: 1, background: C.border }} />
      </div>

      {/* Best Compliments */}
      <div style={{
        fontFamily: "var(--font-playfair)", fontStyle: "italic",
        fontSize: 15, color: C.text, marginBottom: 10,
      }}>
        With Best Compliments
      </div>
      <div style={{
        fontFamily: "var(--font-playfair)", fontWeight: 600,
        fontSize: 17, color: C.dark, marginBottom: 14,
      }}>
        Ajay M A &amp; Haripriya Ajay
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
        {[
          { label: "9633100395", tel: "+919633100395" },
          { label: "8129580285", tel: "+918129580285" },
        ].map(({ label, tel }) => (
          <a
            key={tel}
            href={`tel:${tel}`}
            style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              fontFamily: "var(--font-outfit)", fontWeight: 500, fontSize: 15,
              color: C.dark, textDecoration: "none",
              padding: "8px 18px", borderRadius: 100,
              border: `1px solid ${C.border}`,
              background: C.white,
              transition: "border-color 0.2s, color 0.2s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = C.accent;
              e.currentTarget.style.color = C.accent;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = C.border;
              e.currentTarget.style.color = C.dark;
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
              style={{ width: 14, height: 14, flexShrink: 0 }}>
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.5 2 2 0 0 1 3.6 1.36h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92Z"/>
            </svg>
            {label}
          </a>
        ))}
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────
export default function WeddingPage() {
  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }

        .reveal {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.85s ease, transform 0.85s ease;
        }
        .reveal.in { opacity: 1; transform: none; }
        @media (prefers-reduced-motion: reduce) {
          .reveal { opacity: 1; transform: none; transition: none; }
          .date-char { opacity: 1 !important; animation: none !important; }
        }

        /* ── Hero title ── */
        .mangalyam {
          font-family: var(--font-mal), 'Noto Serif Malayalam', serif;
          font-size: clamp(58px, 16vw, 100px);
          font-weight: 700;
          line-height: 1.15;
          margin: 0;
          background: linear-gradient(158deg, #DEB84A 0%, #C4922A 38%, #A3731A 72%, #BF8B24 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 4px 24px rgba(196,146,42,0.55));
          animation: mang-reveal 2s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both;
        }
        @keyframes mang-reveal {
          0%   { opacity: 0; transform: translateY(32px) scale(0.94); filter: drop-shadow(0 2px 18px rgba(196,146,42,0)) blur(10px); }
          60%  { filter: drop-shadow(0 2px 18px rgba(196,146,42,0.3)) blur(0); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: drop-shadow(0 4px 24px rgba(196,146,42,0.55)) blur(0); }
        }

        .hero-names {
          font-family: var(--font-great-vibes);
          font-size: clamp(1.8rem, 5vw, 2.6rem);
          color: rgba(255,255,255,0.92);
          text-shadow: 0 2px 16px rgba(0,0,0,0.3);
          margin-top: 16px;
          animation: hero-sub-in 1.1s ease 1.4s both;
        }

        .hero-date {
          margin-top: 18px;
          font-family: var(--font-outfit);
          font-weight: 300;
          font-size: 14px;
          letter-spacing: 0.42em;
          color: rgba(255,255,255,0.75);
        }

        .date-char {
          display: inline-block;
          opacity: 0;
          animation: char-in 0.45s ease forwards;
        }
        @keyframes char-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes hero-sub-in {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Scroll arrow bounce ── */
        .bounce-arrow {
          animation: bounce 1.8s ease-in-out infinite;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(7px); }
        }

        /* ── Layout grids ── */
        .celebration-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 64px;
        }
        @media (min-width: 900px) {
          .celebration-grid {
            grid-template-columns: 7fr 5fr;
            gap: 80px;
            align-items: center;
          }
        }

        .detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          align-items: stretch;
        }
        .detail-grid > * { height: 100%; }
        .detail-grid > * > div { height: 100%; box-sizing: border-box; }
        @media (max-width: 520px) {
          .detail-grid { grid-template-columns: 1fr; }
        }

        .events-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 18px;
          align-items: stretch;
        }
        .events-grid > * { height: 100%; }
        .events-grid > * > div { height: 100%; box-sizing: border-box; }
        @media (min-width: 700px) {
          .events-grid { grid-template-columns: repeat(3, 1fr); }
        }

        /* ── Polaroid ── */
        .polaroid-card {
          background: #fff;
          padding: 16px 16px 8px;
          box-shadow: 0 20px 60px rgba(44,62,56,0.14);
          transform: rotate(2.5deg);
          transition: transform 0.45s ease, box-shadow 0.45s ease;
          max-width: 300px;
          width: 100%;
          cursor: default;
        }
        .polaroid-card:hover {
          transform: rotate(0deg) scale(1.04);
          box-shadow: 0 32px 80px rgba(44,62,56,0.22);
        }

        /* ── Link hover ── */
        a[href*="maps.google"]:hover {
          opacity: 0.75;
        }
      `}</style>

      <FallingCanvas />
      <TopBar />
      <Hero />
      <Celebration />
      <Events />
      <RSVP />
      <Footer />
    </>
  );
}
