"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const DROID_SIZE = 140;
/** Keep the droid inside .bb8-inner (head/antennas near the left). */
const DROID_LEFT_INSET = 8;
/** Extra px so shadow / rounding doesn’t clip at the right edge. */
const DROID_RIGHT_INSET = 8;
const MIN_SPEED = 1;
const MAX_SPEED = 4;
const ACCEL = 1.04;
const SLOW_OFFSET = 120;
/** إخفاء مؤشر الأسهم بعد تمرير قليل؛ إعادة الظهور عند العودة لأعلى الصفحة */
const SCROLL_HINT_HIDE_AFTER_PX = 48;

export function Bb8DroidSection() {
  const innerRef = useRef<HTMLDivElement | null>(null);
  const bb8Ref = useRef<HTMLDivElement | null>(null);
  const ballRef = useRef<HTMLDivElement | null>(null);
  const dPosRef = useRef(0);
  const dSpeedRef = useRef(1);
  const dRotRef = useRef(0);
  const mPosRef = useRef(0);
  const movingRightRef = useRef(false);
  const animRef = useRef<number | null>(null);
  const [movingRight, setMovingRight] = useState(false);
  const [scrollHintVisible, setScrollHintVisible] = useState(true);
  const [welcomeText, setWelcomeText] = useState("");

  useEffect(() => {
    let alive = true;
    fetch("/api/public/site-branding")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { bb8WelcomeText?: string | null } | null) => {
        if (!alive) return;
        setWelcomeText(d?.bb8WelcomeText?.trim() ?? "");
      })
      .catch(() => {
        if (!alive) return;
        setWelcomeText("");
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setScrollHintVisible(window.scrollY < SCROLL_HINT_HIDE_AFTER_PX);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const inner = innerRef.current;
    if (!inner) return;

    /** Track width must be .bb8-inner: the droid is positioned inside it, not the full-width <section>. */
    const getWidth = () => inner.clientWidth;
    const clampDPos = (v: number, width: number) => {
      const minP = DROID_LEFT_INSET;
      const maxP = Math.max(minP, width - DROID_SIZE - DROID_RIGHT_INSET);
      return Math.min(maxP, Math.max(minP, v));
    };

    mPosRef.current = getWidth() - getWidth() / 5;
    dPosRef.current = clampDPos(getWidth() / 8, getWidth());

    const updateMousePos = (x: number) => {
      const rect = inner.getBoundingClientRect();
      mPosRef.current = Math.min(rect.width, Math.max(0, x - rect.left));
    };

    const onPointerMove = (e: PointerEvent) => updateMousePos(e.clientX);
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      updateMousePos(t.clientX);
    };
    const onResize = () => {
      const width = getWidth();
      mPosRef.current = Math.min(width, Math.max(0, mPosRef.current));
      dPosRef.current = clampDPos(dPosRef.current, width);
    };

    const ro = new ResizeObserver(() => onResize());
    ro.observe(inner);

    const step = () => {
      const dPos = dPosRef.current;
      const mPos = mPosRef.current;
      const posBefore = dPosRef.current;
      let dSpeed = dSpeedRef.current;
      let dRot = dRotRef.current;
      let movingRight = movingRightRef.current;
      let triedMove = false;

      if (mPos > dPos + DROID_SIZE / 4) {
        triedMove = true;
        if (!movingRight) movingRight = true;
        if (mPos - dPos > SLOW_OFFSET) {
          if (dSpeed < MAX_SPEED) dSpeed *= ACCEL;
        } else if (mPos - dPos < SLOW_OFFSET) {
          if (dSpeed > MIN_SPEED) dSpeed /= ACCEL;
        }
        dPosRef.current += dSpeed;
      } else if (mPos < dPos - DROID_SIZE / 4) {
        triedMove = true;
        if (movingRight) movingRight = false;
        if (dPos - mPos > SLOW_OFFSET) {
          if (dSpeed < MAX_SPEED) dSpeed *= ACCEL;
        } else if (dPos - mPos < SLOW_OFFSET) {
          if (dSpeed > MIN_SPEED) dSpeed /= ACCEL;
        }
        dPosRef.current -= dSpeed;
      }

      dPosRef.current = clampDPos(dPosRef.current, getWidth());
      const posDelta = dPosRef.current - posBefore;
      dRot = dRotRef.current + posDelta;
      if (triedMove && posDelta === 0) dSpeed = MIN_SPEED;

      dSpeedRef.current = Math.min(MAX_SPEED, Math.max(MIN_SPEED, dSpeed));
      dRotRef.current = dRot;
      if (bb8Ref.current) bb8Ref.current.style.left = `${dPosRef.current}px`;
      if (ballRef.current) ballRef.current.style.transform = `rotate(${dRotRef.current}deg)`;

      if (movingRight !== movingRightRef.current) {
        movingRightRef.current = movingRight;
        setMovingRight(movingRight);
      }

      animRef.current = requestAnimationFrame(step);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("resize", onResize);
    animRef.current = requestAnimationFrame(step);

    return () => {
      ro.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("resize", onResize);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <>
      <section className="bb8-wrap bg-store-bg" aria-label="BB8 section">
        <div className="bb8-shell">
          <div ref={innerRef} className="bb8-inner">
            <div className="sand" />
            {welcomeText ? <p className="welcome-text">{welcomeText}</p> : null}
            <div ref={bb8Ref} className="bb8" style={{ left: `${dPosRef.current}px` }}>
              <div className={`antennas ${movingRight ? "right" : ""}`}>
                <div className="antenna short" />
                <div className="antenna long" />
              </div>
              <div className="head">
                <div className="stripe one" />
                <div className="stripe two" />
                <div className={`eyes ${movingRight ? "right" : ""}`}>
                  <div className="eye one" />
                  <div className="eye two" />
                </div>
                <div className="stripe three" />
              </div>
              <div ref={ballRef} className="ball" style={{ transform: `rotate(${dRotRef.current}deg)` }}>
                <div className="lines one" />
                <div className="lines two" />
                <div className="ring one" />
                <div className="ring two" />
                <div className="ring three" />
              </div>
              <div className="shadow" />
            </div>
          </div>
          <div
            className={cn("scroll-hint-wrap", !scrollHintVisible && "scroll-hint-wrap--hidden")}
            aria-hidden={!scrollHintVisible}
          >
            <button
              type="button"
              className="scroll-hint-btn"
              tabIndex={scrollHintVisible ? 0 : -1}
              onClick={() => {
                window.scrollBy({
                  top: Math.min(window.innerHeight * 0.85, 720),
                  behavior: "smooth",
                });
              }}
              aria-label="التمرير للأسفل لمشاهدة المزيد"
            >
              <span className="scroll-hint-chevs" aria-hidden>
                <span className="scroll-hint-chev" />
                <span className="scroll-hint-chev" />
                <span className="scroll-hint-chev" />
              </span>
            </button>
          </div>
        </div>
      </section>

      <style jsx>{`
        @font-face {
          font-family: "MilligramArabicBoldTrial";
          src: url("/fonts/Milligram-Arabic-Bold-TRIAL.ttf") format("truetype");
          font-display: swap;
        }
        .bb8-wrap {
          background: transparent;
          padding-bottom: 26px;
        }
        .bb8-shell {
          max-width: 1400px;
          margin: 0 auto;
          padding: 10px 12px 0;
        }
        @media (min-width: 640px) {
          .bb8-shell {
            padding-left: 16px;
            padding-right: 16px;
          }
        }
        .bb8-inner {
          position: relative;
          overflow: hidden;
          height: 220px;
          background: transparent;
        }
        .sand {
          /* Wider, softer mix into #0b0e14 (store-bg) */
          background: linear-gradient(
            90deg,
            #0b0e14 0%,
            #1c1813 4%,
            #4a3e30 10%,
            #7d6a52 16%,
            #a68b6a 20%,
            #b69c77 25%,
            #b69c77 75%,
            #a68b6a 80%,
            #7d6a52 84%,
            #4a3e30 90%,
            #1c1813 96%,
            #0b0e14 100%
          );
          height: 18%;
          position: absolute;
          width: 100%;
          z-index: 0;
          right: 0;
          bottom: 0;
          left: 0;
        }
        .bb8 {
          position: absolute;
          width: 140px;
          bottom: 10%;
          z-index: 2;
        }
        .welcome-text {
          position: absolute;
          left: 50%;
          bottom: 44%;
          transform: translateX(-50%);
          margin: 0;
          color: #fff;
          font-family: var(--font-figures), "MilligramArabicBoldTrial", sans-serif;
          font-size: clamp(1.75rem, 4.25vw, 3.5rem);
          font-weight: 900;
          line-height: 1.1;
          letter-spacing: 0.01em;
          text-align: center;
          white-space: normal;
          max-width: min(92vw, 42rem);
          pointer-events: none;
          z-index: 1;
          text-shadow: 0 6px 30px rgba(0, 0, 0, 0.35);
        }
        .scroll-hint-wrap {
          display: flex;
          justify-content: center;
          margin-top: -48px;
          padding: 0 0 6px;
          position: relative;
          z-index: 3;
          opacity: 1;
          transition: opacity 0.3s ease;
        }
        .scroll-hint-wrap--hidden {
          opacity: 0;
          pointer-events: none;
        }
        .scroll-hint-wrap--hidden .scroll-hint-chevs {
          animation: none;
        }
        .scroll-hint-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          padding: 2px 20px 4px;
          cursor: pointer;
          color: #000;
        }
        .scroll-hint-btn:hover,
        .scroll-hint-btn:focus-visible {
          color: #0a0a0a;
          outline: none;
        }
        .scroll-hint-btn:focus-visible {
          box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.4);
          border-radius: 8px;
        }
        .scroll-hint-chevs {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
          animation: scroll-hint-bob 1.35s ease-in-out infinite;
        }
        .scroll-hint-chev {
          display: block;
          width: 18px;
          height: 18px;
          border-right: 3px solid currentColor;
          border-bottom: 3px solid currentColor;
          transform: rotate(45deg);
          margin-top: -8px;
          opacity: 0.95;
        }
        .scroll-hint-chev:first-child {
          margin-top: 0;
          animation: scroll-hint-fade 1.35s ease-in-out infinite;
        }
        .scroll-hint-chev:nth-child(2) {
          animation: scroll-hint-fade 1.35s ease-in-out infinite 0.15s;
          opacity: 0.8;
        }
        .scroll-hint-chev:nth-child(3) {
          animation: scroll-hint-fade 1.35s ease-in-out infinite 0.3s;
          opacity: 0.65;
        }
        @keyframes scroll-hint-bob {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(6px);
          }
        }
        @keyframes scroll-hint-fade {
          0%,
          100% {
            opacity: 0.45;
          }
          50% {
            opacity: 1;
          }
        }
        .antennas {
          position: absolute;
          transition: left 0.6s;
          left: 22%;
        }
        .antennas.right {
          left: 0%;
        }
        .antenna {
          background: #e0d2be;
          position: absolute;
          width: 2px;
        }
        .antenna.short {
          height: 20px;
          top: -60px;
          left: 50px;
        }
        .antenna.long {
          border-top: 6px solid #020204;
          border-bottom: 6px solid #020204;
          height: 36px;
          top: -78px;
          left: 56px;
        }
        .head {
          background: #e0d2be;
          border-radius: 90px 90px 14px 14px;
          height: 56px;
          margin-left: -45px;
          overflow: hidden;
          position: absolute;
          width: 90px;
          z-index: 1;
          top: -46px;
          left: 50%;
        }
        .stripe {
          position: absolute;
          width: 100%;
        }
        .stripe.one {
          background: #999;
          height: 6px;
          opacity: 0.8;
          z-index: 1;
          top: 6px;
        }
        .stripe.two {
          background: #cd7640;
          height: 4px;
          top: 17px;
        }
        .stripe.three {
          background: #999;
          height: 4px;
          opacity: 0.5;
          bottom: 3px;
        }
        .eyes {
          display: block;
          height: 100%;
          position: absolute;
          width: 100%;
          transition: left 0.6s;
          left: 0%;
        }
        .eyes.right {
          left: 36%;
        }
        .eye {
          border-radius: 50%;
          display: block;
          position: absolute;
        }
        .eye.one {
          background: #020204;
          border: 4px solid #e0d2be;
          height: 30px;
          width: 30px;
          top: 12px;
          left: 12%;
        }
        .eye.one::after {
          background: white;
          border-radius: 50%;
          content: "";
          display: block;
          height: 3px;
          position: absolute;
          width: 3px;
          top: 4px;
          right: 4px;
        }
        .eye.two {
          background: #e0d2be;
          border: 1px solid #020204;
          height: 16px;
          width: 16px;
          top: 30px;
          left: 40%;
        }
        .eye.two::after {
          background: #020204;
          border-radius: 50%;
          content: "";
          display: block;
          height: 10px;
          position: absolute;
          width: 10px;
          top: 2px;
          left: 2px;
        }
        .ball {
          background: #d1c3ad;
          border-radius: 50%;
          height: 140px;
          overflow: hidden;
          position: relative;
          width: 140px;
          will-change: transform;
        }
        .lines {
          border: 2px solid #b19669;
          border-radius: 50%;
          height: 400px;
          opacity: 0.6;
          position: absolute;
          width: 400px;
        }
        .lines.two {
          top: -10px;
          left: -250px;
        }
        .ring {
          background: #cd7640;
          border-radius: 50%;
          height: 70px;
          margin-left: -35px;
          position: absolute;
          width: 70px;
        }
        .ring::after {
          background: #d1c3ad;
          border-radius: 50%;
          content: "";
          display: block;
          height: 70%;
          margin-top: -35%;
          margin-left: -35%;
          position: absolute;
          width: 70%;
          top: 50%;
          left: 50%;
        }
        .ring.one {
          margin-left: -40px;
          height: 80px;
          width: 90px;
          top: 6%;
          left: 50%;
        }
        .ring.two {
          height: 38px;
          width: 76px;
          transform: rotate(36deg);
          top: 70%;
          left: 18%;
        }
        .ring.two::after {
          top: 100%;
        }
        .ring.three {
          height: 30px;
          transform: rotate(-50deg);
          top: 66%;
          left: 90%;
        }
        .ring.three::after {
          top: 110%;
        }
        .shadow {
          background: #3a271c;
          border-radius: 50%;
          height: 23px;
          opacity: 0.7;
          position: absolute;
          width: 140px;
          z-index: -1;
          left: 5px;
          bottom: -8px;
        }
      `}</style>
    </>
  );
}
