# Design QA — рейтинг сезона 2026

- Source visual truth: `/Users/satunkin/.codex/generated_images/019f5bbf-9842-7931-b7a5-6040208da464/exec-ba127d92-0e60-4dcc-9e79-3aa85c73426d.png`
- Implementation URL: `http://localhost:3010/leaderboard?ageGroup=35-39`
- Final implementation screenshot: `/Users/satunkin/.codex/visualizations/2026/07/13/019f5bbf-9842-7931-b7a5-6040208da464/leaderboard-desktop-final.png`
- Full-view comparison: `/Users/satunkin/.codex/visualizations/2026/07/13/019f5bbf-9842-7931-b7a5-6040208da464/design-comparison-final.png`
- Focused table comparison: `/Users/satunkin/.codex/visualizations/2026/07/13/019f5bbf-9842-7931-b7a5-6040208da464/design-comparison-focused.png`
- Primary viewport/state: 1440×1024, age group 35–39, both genders, one athlete expanded.
- Responsive evidence: 768×1024 and 390×844; final mobile screenshot at `/Users/satunkin/.codex/visualizations/2026/07/13/019f5bbf-9842-7931-b7a5-6040208da464/leaderboard-mobile-final.png`.
- Pagination annotation result: `/Users/satunkin/.codex/visualizations/2026/07/13/019f5bbf-9842-7931-b7a5-6040208da464/leaderboard-pagination-in-headers.png`.
- Pagination before/after comparison: `/Users/satunkin/.codex/visualizations/2026/07/13/019f5bbf-9842-7931-b7a5-6040208da464/pagination-comment-comparison.png`.

## Findings

No actionable P0/P1/P2 findings remain.

- Fonts and typography: system sans-serif family, compact weight hierarchy and tabular numbers preserve the source's utilitarian sports-dashboard tone. Long fixture names truncate without breaking the grid.
- Spacing and layout rhythm: final desktop uses the source's single left rail, dense rows, restrained borders and two-column expanded result history. Both gender tables begin within the first viewport.
- Colors and tokens: neutral white/gray surfaces and one blue interactive accent match the source direction; status colors remain semantic and low-saturation.
- Image quality and assets: the target is an icon-and-data interface without photography. All visible icons use the Phosphor library; no inline SVG, emoji, CSS illustration or placeholder image substitutes were introduced.
- Copy and content: the implementation explicitly explains that filtering does not recalculate absolute rank. Age-group rows show nonconsecutive absolute positions.
- Responsiveness and accessibility: 390 px and 768 px report `scrollWidth === clientWidth`; mobile uses a gender switch, collapsible filters and 44 px controls. Focus styles and semantic buttons/labels are present.
- Interactions/states: search and select filters, pagination, row expansion, mobile menu, loading, error and empty states were checked. `/cabinet` fixture preview is read-only with disabled actions.

## Comparison history

1. Initial comparison found a P2 density mismatch: expanded results were one large vertical card stack, pushing the women's table far below the first viewport.
2. Fix: result history was split into compact “Зачётные старты” and “Резерв” columns; desktop athlete rows were converted to a multi-column dense table.
3. Post-fix evidence: `design-comparison-final.png` and `design-comparison-focused.png` show the selected one-rail composition, compact table rhythm, nonconsecutive ranks and both gender sections in the initial desktop viewport.
4. Browser annotation requested replacing each “N на странице” badge with pagination and removing pagination below both tables.
5. Fix: independent compact `malePage` and `femalePage` controls were moved into the matching table headers; the lower duplicate block was removed. At 1031 px the expanded result groups now stack to avoid clipping.
6. Post-fix evidence: `pagination-comment-comparison.png`; independent transition verified at `/leaderboard?malePage=2` while the female control remained on page 1. At 390 px, `scrollWidth === clientWidth`.
7. Follow-up annotation requested keeping the viewport anchored when switching women's pages and opening the site on the unfiltered rating.
8. Fix: pagination links persist and restore the current scroll position across the App Router transition; `/` now redirects to the clean `/leaderboard` URL.
9. Post-fix browser evidence: the women's transition from page 1 to page 2 kept `window.scrollY` at `620` (delta `0`); opening `/` resolved to `/leaderboard` with empty `q`, `ageGroup`, `club` and `coach` values. The change is behavioral and does not alter the approved visual composition.

## Primary interactions tested

- age-group filter state from URL;
- absolute rank preservation (`3, 7, 20, 27…` for 35–39);
- row expand/collapse state and top-3/reserve split;
- second page of both gender ratings;
- scroll-position preservation during independent gender pagination;
- clean root redirect to the unfiltered rating;
- competition list, club card and cabinet preview fixture routes;
- desktop, tablet and mobile overflow;
- browser console: no errors on final cabinet preview check.

## Follow-up polish (P3)

- The source mock shows rank-change deltas and “best start”; production data has no trustworthy historical-delta field, so the implementation intentionally omits invented values.
- The source sidebar contains additional product areas not present in current routing. Existing real routes are shown instead.

final result: passed
