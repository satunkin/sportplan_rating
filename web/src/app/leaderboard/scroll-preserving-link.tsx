"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLayoutEffect } from "react";

const SCROLL_STORAGE_KEY = "cyclon:leaderboard-scroll-position";

export function ScrollPreservingLink({
  ariaLabel,
  children,
  className,
  href,
}: {
  ariaLabel: string;
  children: React.ReactNode;
  className: string;
  href: string;
}) {
  return (
    <Link
      aria-label={ariaLabel}
      className={className}
      href={href}
      onClick={() => {
        window.sessionStorage.setItem(SCROLL_STORAGE_KEY, String(window.scrollY));
      }}
      scroll={false}
    >
      {children}
    </Link>
  );
}

export function LeaderboardScrollRestorer() {
  const searchParams = useSearchParams();

  useLayoutEffect(() => {
    const storedPosition = window.sessionStorage.getItem(SCROLL_STORAGE_KEY);
    if (storedPosition === null) return;

    const scrollPosition = Number(storedPosition);
    if (!Number.isFinite(scrollPosition)) {
      window.sessionStorage.removeItem(SCROLL_STORAGE_KEY);
      return;
    }

    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      window.scrollTo({ top: scrollPosition, behavior: "instant" });
      secondFrame = window.requestAnimationFrame(() => {
        window.scrollTo({ top: scrollPosition, behavior: "instant" });
        window.sessionStorage.removeItem(SCROLL_STORAGE_KEY);
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
    };
  }, [searchParams]);

  return null;
}
