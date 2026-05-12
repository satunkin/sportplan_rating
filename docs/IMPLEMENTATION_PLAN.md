# Cyclon Rating MVP Implementation Plan

This document translates the PRD into an execution plan in `loki-mode`: smallest meaningful slices, fast verification, and momentum toward a working MVP.

## 1. Goal

Deliver a usable MVP for seasonal athlete ranking with:
- athlete registration and login;
- result submission;
- admin moderation;
- score calculation;
- public leaderboard;
- athlete personal account.

## 2. Product Assumptions

Until business decisions are finalized, implementation should assume:
- one active season at a time;
- age group is computed from a configurable season rule;
- events with fewer than `5` finishers in an age group require admin review;
- swimming and cycling category mappings are editable by admin;
- result verification is manual-first, auto-check second.

## 3. Architecture Recommendation

Recommended MVP stack:
- `Next.js` app for web UI and backend routes
- `PostgreSQL` for data
- `Prisma` for schema and migrations
- `NextAuth` or custom auth for email and Telegram login
- admin area inside the same app
- background jobs for recalculation and protocol imports

## 4. Execution Slices

### Slice 1. Foundation

Deliverables:
- repository bootstrap;
- environment config;
- database connection;
- Prisma schema baseline;
- app shell;
- authentication scaffolding.

Verification:
- app runs locally;
- database migrations apply cleanly;
- health page returns success.

### Slice 2. Core Data Model

Deliverables:
- schema for users, athletes, seasons, events, raw results, verified results, rankings, reviews;
- seed data for one season and score rules.

Verification:
- migrations succeed;
- seed succeeds;
- sample queries return expected relations.

### Slice 3. Athlete Registration and Account

Deliverables:
- registration flow;
- login flow;
- athlete profile form;
- age group calculation service.

Verification:
- user can register and log in;
- athlete record is created;
- age group is computed and shown in UI.

### Slice 4. Result Submission

Deliverables:
- athlete submission form;
- validation rules;
- submission list in personal account;
- submission status tracking.

Verification:
- athlete can create a result submission;
- invalid forms are rejected;
- stored submission appears in account.

### Slice 5. Admin Moderation

Deliverables:
- admin login gating;
- moderation queue;
- approve, reject, edit actions;
- audit logging.

Verification:
- admin can review a submission;
- decision updates status;
- audit log captures action.

### Slice 6. Ranking Engine

Deliverables:
- fifth-place lookup logic;
- lag percent calculation;
- score rule lookup;
- best-three aggregation;
- leaderboard snapshot generation.

Verification:
- unit tests for scoring examples;
- sample athlete scores match expected totals;
- leaderboard order is deterministic.

### Slice 7. Public Leaderboard and Athlete Views

Deliverables:
- public leaderboard page;
- filters;
- athlete summary page;
- result summaries.

Verification:
- guest can access leaderboard;
- filters work;
- leaderboard loads within acceptable range on sample data.

### Slice 8. Protocol Import Support

Deliverables:
- basic event/protocol entry;
- raw protocol storage;
- result candidate matching helpers;
- admin-assist workflow for semi-automatic verification.

Verification:
- imported protocol data can be linked to athlete submissions;
- ambiguous matches stay in review state.

## 5. MVP Backlog

### P0 Stories

1. As a guest, I can register as an athlete.
2. As an athlete, I can sign in and manage my profile.
3. As an athlete, I can submit a race result.
4. As an athlete, I can see the status of each submitted result.
5. As an admin, I can create and edit events.
6. As an admin, I can review submitted results.
7. As an admin, I can verify, reject, or edit a result.
8. As the system, I can calculate points for a verified result.
9. As the system, I can keep only the best three results in the season total.
10. As a guest, I can view the public leaderboard.
11. As an athlete, I can see my rank and verified results in my account.

### P1 Stories

1. As an admin, I can import protocol rows for an event.
2. As the system, I can suggest result matches from protocol data.
3. As an athlete, I can receive Telegram notifications about moderation decisions.
4. As a guest, I can filter the leaderboard by discipline and age group.

## 6. Domain Rules To Encode

- A result contributes to ranking only if status is `verified`.
- The season total is the sum of the top three verified results by points.
- A result with unresolved business ambiguity must remain in admin review.
- Score calculation must preserve raw inputs used in the decision:
  - athlete age group;
  - fifth-place result;
  - lag percent;
  - selected score rule;
  - awarded points.

## 7. Suggested Data Entities

### users
- id
- email
- telegram_id
- role
- created_at

### athletes
- id
- user_id
- first_name
- last_name
- middle_name
- birth_date
- gender
- city
- season_age_group

### seasons
- id
- name
- start_date
- end_date
- status

### events
- id
- name
- event_date
- discipline
- distance_label
- category_id
- source_url

### event_protocol_rows
- id
- event_id
- athlete_name_raw
- gender
- age_group_raw
- finish_time_raw
- finish_time_seconds
- placement_in_age_group

### result_submissions
- id
- athlete_id
- season_id
- event_id nullable
- event_name_raw
- discipline
- distance_label
- age_group_claimed
- finish_time_seconds
- protocol_url
- status
- admin_notes

### verified_results
- id
- athlete_id
- season_id
- submission_id
- event_id
- age_group_used
- fifth_place_time_seconds
- lag_percent
- score_rule_id
- awarded_points
- verification_mode

### score_rules
- id
- discipline
- category_key
- base_points
- active_from

### ranking_entries
- id
- athlete_id
- season_id
- total_points
- rank
- scored_results_count

### audit_log
- id
- actor_user_id
- entity_type
- entity_id
- action
- payload_json
- created_at

## 8. API Outline

### Public
- `GET /api/leaderboard`
- `GET /api/leaderboard/:athleteId`
- `GET /api/rules`

### Athlete
- `POST /api/auth/...`
- `GET /api/me`
- `PATCH /api/me`
- `GET /api/my-results`
- `POST /api/my-results`

### Admin
- `GET /api/admin/submissions`
- `PATCH /api/admin/submissions/:id`
- `POST /api/admin/events`
- `PATCH /api/admin/events/:id`
- `POST /api/admin/protocols/import`
- `POST /api/admin/recalculate`

## 9. UI Surfaces

### Public
- home page
- rules page
- leaderboard page
- athlete public page, optional

### Athlete
- sign-in / registration
- profile page
- result submission page
- my results page
- dashboard with rank and best three results

### Admin
- submissions queue
- submission detail
- events list
- event detail
- protocol upload/import page
- score rules settings

## 10. Validation Strategy

Minimum automated checks:
- required field validation;
- valid time format;
- supported discipline and category;
- duplicate submission warning;
- consistency checks between submission and protocol row, when present.

## 11. Verification Strategy

For each meaningful slice:
- run lint;
- run tests;
- verify key pages manually;
- seed demo data and confirm scoring behavior.

Recommended target commands after implementation exists:
- `npm run lint`
- `npm run test`
- `npm run build`

## 12. Delivery Order

1. Bootstrap project
2. Model data
3. Build auth and athlete profile
4. Build result submission flow
5. Build admin moderation
6. Implement ranking engine
7. Build public leaderboard
8. Add protocol import helpers

## 13. Ready-For-Dev Exit Criteria

The product is ready to move from planning into implementation when:
- business rules in PRD are approved;
- score categories are defined for all supported sports;
- one stack decision is made;
- initial design direction is accepted;
- seed season and score rule tables are defined.
