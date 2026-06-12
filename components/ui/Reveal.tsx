'use client';

import { ReactNode } from 'react';
import { useInView } from '@/hooks/useInView';

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

// ── Line-by-line curtain reveal ─────────────────────────────────────────────
// Each line slides up from behind an overflow-hidden mask — the "premium" reveal.
// Usage: <RevealText lines={['Luminous,', 'Nourishing', 'Skin Care']} className="..." />

interface RevealTextProps {
  lines: string[];
  className?: string;
  delay?: number;
  stagger?: number;
  duration?: number;
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'div';
}

export function RevealText({
  lines,
  className = '',
  delay = 0,
  stagger = 110,
  duration = 820,
  tag: Tag = 'div',
}: RevealTextProps) {
  const { ref, inView } = useInView(0.2);

  return (
    // @ts-ignore — ref typing is safe here
    <Tag ref={ref} className={className} aria-label={lines.join(' ')}>
      {lines.map((line, i) => (
        <span
          key={i}
          style={{ display: 'block', overflow: 'hidden', paddingBottom: '0.07em' }}
        >
          <span
            style={{
              display: 'block',
              transform: inView ? 'translateY(0)' : 'translateY(110%)',
              transition: `transform ${duration}ms ${EASE} ${delay + i * stagger}ms`,
            }}
          >
            {line}
          </span>
        </span>
      ))}
    </Tag>
  );
}

// ── Fade + slide up ─────────────────────────────────────────────────────────
// General-purpose wrapper: fades in and rises from below on scroll.
// Usage: <FadeUp delay={200}><p>…</p></FadeUp>

interface FadeUpProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  distance?: number;
  className?: string;
  threshold?: number;
}

export function FadeUp({
  children,
  delay = 0,
  duration = 700,
  distance = 26,
  className = '',
  threshold = 0.15,
}: FadeUpProps) {
  const { ref, inView } = useInView(threshold);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : `translateY(${distance}px)`,
        transition: `opacity ${duration}ms ${EASE} ${delay}ms, transform ${duration}ms ${EASE} ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ── Scale + fade (for images / cards) ──────────────────────────────────────
// Starts slightly zoomed and transparent, settles to natural size.

interface ScaleInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  threshold?: number;
}

export function ScaleIn({
  children,
  delay = 0,
  duration = 800,
  className = '',
  threshold = 0.1,
}: ScaleInProps) {
  const { ref, inView } = useInView(threshold);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'scale(1) translateY(0)' : 'scale(1.04) translateY(20px)',
        transition: `opacity ${duration}ms ${EASE} ${delay}ms, transform ${duration}ms ${EASE} ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
