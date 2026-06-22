# Product — Кубок Циклон · 2026

## Register

product

## Users

Кубок Циклон serves two main groups.

Amateur endurance athletes use the public website to understand the season rating, check standings, inspect events, read rules, and see how participation works. The target audience is adults 18+ across running, cycling, open-water swimming, and triathlon. Their context is practical: they want to know whether their result counts, how points are calculated, and where they stand in the season.

Administrators use the admin interface to manage events, athletes, protocol imports, result moderation, and future Telegram communications. Their work is repetitive and accuracy-sensitive, so the interface should support scanning, comparison, review, and confident decisions.

## Product Purpose

Кубок Циклон is a transparent seasonal ranking system for amateur endurance athletes. The website publishes the rating and competitions, Telegram is the athlete interface, and the admin panel validates submissions and reference data.

Success means athletes trust the ranking logic, administrators can verify results without confusion, and the public website makes the current state of the season easy to understand without exposing implementation details.

## Brand Personality

Strict, calm, transparent.

The product should feel like a serious sport rating office: precise, readable, and confident. It should not feel like a decorative sports promo page. The interface should make data and rules feel inspectable, not hidden behind marketing language.

## Anti-references

- Decorative SaaS marketing patterns that compete with the rating data.
- Overloaded card grids where every page becomes the same repeated block.
- AI-looking visual effects: gradient text, decorative glow, oversized rounded cards, glassmorphism, ornamental backgrounds.
- Unclear scoring explanations or UI that makes point decisions feel arbitrary.
- Dense admin screens without hierarchy, status clarity, or obvious next actions.

## Design Principles

- Put the rating first: standings, points, events, and moderation status should be visible before supporting explanation.
- Make trust inspectable: show the rule, source, protocol status, and moderation decision where they affect the result.
- Keep surfaces quiet: use restrained structure, strong typography, and one clear accent instead of decoration.
- Preserve task flow: admin pages should be compact, scannable, and predictable for repeated work.
- Separate public clarity from internal detail: hide developer-oriented explanations from public UX, but keep technical notes available where they help future work.

## Accessibility & Inclusion

Use WCAG AA as the baseline. Text contrast should be readable on all public and admin surfaces. Navigation, forms, links, and moderation controls should work with keyboard focus. Avoid relying on color alone for status. Respect reduced-motion preferences for any animation or transition. Keep Russian copy clear, literal, and understandable for non-technical athletes and administrators.
