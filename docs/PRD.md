# Cyclon Rating PRD

Version: `v1.0`
Date: `2026-05-12`
Status: `Draft for implementation`

## 1. Product Overview

Cyclon Rating is a seasonal ranking system for amateur athletes. During a season, athletes accumulate points for race results, and the final standings are based on the sum of each athlete's three best performances.

The product must:
- allow an athlete to register;
- collect race results from the athlete;
- validate results using public race result sources where possible;
- calculate ranking points using approved scoring rules;
- display a public leaderboard;
- provide each athlete with a personal account showing results, score, and position;
- provide administrators with review and moderation tools.

## 2. Business Goal

Create a transparent seasonal motivation system for amateur athletes across endurance sports, increase participation in events, and drive repeat engagement throughout the season.

## 3. Target Audience

- Amateur runners
- Amateur cyclists
- Amateur open-water swimmers
- Amateur triathletes
- Age: `18+`
- Expected scale: up to `1000` registered athletes per season

## 4. Product Channels

Recommended MVP channel mix:
- `Website` as the main product surface: rules, registration, account, ranking
- `Telegram` as a companion channel: login, notifications, fast result submission

For MVP:
- website is mandatory;
- Telegram bot is optional for phase 2.

## 5. MVP Scope

Included:
- athlete registration;
- authentication;
- personal account;
- result submission;
- manual and semi-automatic result validation;
- score calculation;
- public leaderboard;
- admin panel;
- result history and moderation statuses.

Excluded:
- native mobile app;
- full automatic parsing of all race result sites;
- broad OCR/PDF automation for arbitrary documents;
- payments;
- social features.

## 6. Core Ranking Logic

Season ranking equals the sum of an athlete's `3 best scored results`.

Eligible disciplines:
- running;
- cycling;
- open-water swimming;
- triathlon.

For each verified result the system must:
1. determine discipline and distance category;
2. find the `5th place` in the athlete's age group;
3. compute percentage lag from the `5th place`;
4. calculate points using the approved scoring table or formula;
5. store the scored result;
6. update the athlete's best three results;
7. recalculate season total and leaderboard position.

## 7. Scoring

Each result uses:
- a `base_points` value determined by distance category;
- a decay based on percentage lag from the `5th place` in the age group.

The system must support:
- official running categories;
- official triathlon categories;
- configurable swimming categories;
- configurable cycling categories.

The implementation must allow changing:
- distance categories;
- base points;
- sport-to-category mappings;
without code deployment where possible.

## 8. Rules Requiring Final Approval Before Release

The product depends on final business decisions for:
- how age group is determined for a season;
- what happens when an age group has fewer than `5` finishers;
- whether external events outside the core series are eligible;
- how merged age groups are handled;
- whether a result can be accepted without a public protocol;
- how appeals and corrections are handled;
- whether late submissions are allowed.

Until approved, these cases must be treated as admin-review cases.

## 9. Roles

- `Guest`
- `Athlete`
- `Administrator`

## 10. Guest User Stories

Guest can:
- read rules;
- browse public leaderboard;
- view athlete profile pages if enabled;
- register;
- sign in.

## 11. Athlete User Stories

Athlete can:
- register;
- sign in;
- edit personal profile;
- submit a result;
- track moderation status;
- view verified results;
- view earned points;
- view current ranking position;
- receive result decision notifications.

## 12. Administrator User Stories

Administrator can:
- create and edit events;
- import protocols or enter results manually;
- verify, reject, and edit submissions;
- configure distance categories and base points;
- trigger leaderboard recalculation;
- edit athlete cards;
- review ambiguous cases;
- view audit history.

## 13. Functional Requirements

### 13.1 Registration and Profile

The system must store:
- first name;
- last name;
- middle name, optional;
- birth date;
- gender;
- city, optional;
- phone or email;
- Telegram ID, optional;
- season age group;
- acceptance of rules and data processing consent.

### 13.2 Authentication

MVP must support at least one method:
- email magic link; or
- Telegram-based authentication.

Recommended:
- email or Telegram login in MVP;
- account linking later.

### 13.3 Result Submission

Submission form must include:
- event name;
- event date;
- discipline;
- distance;
- athlete age group at the event;
- finish time;
- link to official protocol;
- bib number, optional;
- comment, optional.

Statuses:
- `pending_auto_check`
- `pending_manual_review`
- `verified`
- `rejected`

### 13.4 Result Validation

Validation modes:
- `auto`: exact result found in imported protocol;
- `semi-auto`: candidate found and confirmed by admin;
- `manual`: admin enters or confirms the result directly.

If a protocol exists in the system:
- system attempts matching by athlete name, event, age group, and result;
- confident match may be auto-verified;
- ambiguous match goes to moderation.

### 13.5 Ranking Engine

The system must:
- calculate points for every verified result;
- determine best three results;
- calculate season total;
- assign leaderboard position;
- support filtering by gender, age group, discipline, and season.

### 13.6 Public Leaderboard

The public leaderboard must show:
- rank;
- athlete first and last name;
- city, if enabled;
- number of verified eligible starts;
- total score;
- best three results summary;
- link to athlete card if enabled.

### 13.7 Personal Account

The athlete account must show:
- profile details;
- season age group;
- submitted results and statuses;
- verified results;
- points per result;
- current position;
- moderation history for disputed results.

### 13.8 Admin Panel

Admin panel must support:
- athlete management;
- event management;
- moderation queue;
- protocol upload or entry;
- manual verification and rejection;
- ranking recalculation;
- configuration of scoring dictionaries and categories.

## 14. Non-Functional Requirements

- Support at least `1000` athletes without UX degradation
- Public leaderboard load time target: up to `2 sec`
- Full season recalculation target: up to `1 min`
- Mobile responsive UI is mandatory
- Russian language UI
- Audit logging for admin actions
- Backup strategy for database
- Basic access control and secure storage of personal data

## 15. Recommended Stack

- Frontend: `Next.js`
- Backend: `Next.js API` or `NestJS`
- Database: `PostgreSQL`
- ORM: `Prisma`
- Auth: `NextAuth` or custom auth with Telegram/email
- Admin: dedicated admin area or `AdminJS`
- Background jobs: cron or queue for imports and recalculation
- Deploy: `Docker` on Masterhost VPS

## 16. Core Data Model

Main entities:
- `users`
- `athletes`
- `seasons`
- `events`
- `event_categories`
- `event_results_raw`
- `results_verified`
- `ranking_entries`
- `score_rules`
- `manual_reviews`
- `audit_log`

## 17. MVP Success Metrics

- `>= 300` registered athletes in the first season
- `>= 70%` of results processed without long manual back-and-forth
- `<= 10 min` average manual moderation time per ambiguous result
- `>= 30%` of athletes return to the product more than twice during the season
- `< 1%` critical scoring errors

## 18. Key Risks

- different result source formats;
- disputes around age groups and event eligibility;
- false-positive athlete matching;
- insufficiently strict rules before launch;
- fraudulent submissions.

## 19. Delivery Priorities

### P0

- rules finalization support
- registration and authentication
- athlete profile
- result submission
- manual moderation
- score calculation
- public leaderboard
- personal account

### P1

- semi-automatic protocol import
- Telegram notifications
- richer leaderboard filters
- event detail page

### P2

- full Telegram bot submission flow
- broader protocol integrations
- athlete progress charts
- public event pages

## 20. Delivery Phases

### Phase 1. Analysis

- approve final rules;
- approve distance categories;
- approve scoring scales for running, triathlon, cycling, swimming;
- approve rule for groups with fewer than `5` finishers.

### Phase 2. MVP

- website;
- registration;
- account;
- result submission;
- admin panel;
- manual review;
- leaderboard.

### Phase 3. Automation

- protocol import;
- automatic result lookup;
- Telegram integration;
- notifications.

## 21. MVP Acceptance Criteria

MVP is accepted if:
- athlete can register and sign in;
- athlete can submit a result;
- admin can verify or reject a result;
- system calculates score according to approved rules;
- system counts only the best `3` results;
- leaderboard updates after result verification;
- public leaderboard is available without login;
- personal account shows results, points, and rank;
- system remains stable with `1000` participants.

## 22. Open Questions

1. Is age group determined by event date or season date?
2. What happens if an age group has fewer than `5` finishers?
3. Which cycling and swimming distances map to which scoring categories?
4. Which external events are eligible?
5. Are public athlete profile pages required?
6. Is an internal appeal flow required?
7. Is file upload for proof needed in MVP?
