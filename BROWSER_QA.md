# English browser check

2026-09-14 · Codex in-app Browser · default desktop viewport.

- English page heading, welcome, placeholder, buttons and footer confirmed.
- "Chinese food, mango allergy, cold" returns Mung Bean and Job's Tears Soup, with English ingredients, method and allergen notice.
- "Another one" returns wb-061; "Make it room temperature" returns wb-058.
- The preference labels retain Chinese cuisine and mango allergy while changing temperature.
- Document language is en. The tested rendered page contains no Chinese text, one chat textarea and no dropdowns.
- The actual screenshot was inspected for readable layout and no clipped composer controls.

This remains the local prototype. Real Groq generation and free-form recipe adaptation were not tested.

## 2026-09-18 provider failover check

The real UI and HTTP server were exercised in the in-app browser with injected fake provider responses (no live API requests). The DOM showed NVIDIA-assisted chat on primary success, Groq-assisted chat with a backup label after a simulated NVIDIA 503, and Local chat with model unavailable after both failed. Each case returned the standard mung-bean recipe for "Chinese food, mango allergy, cold" and retained the mango restriction and canonical allergen reminder. Configuration labels were separate from actual response-provider labels. No claim of live model quality is made.
# Cooking heat v2 verification — 2026-09-27

Local server, no live model keys: submitted `Chinese food, mango allergy, cold`,
opened `Why this recipe?`, then asked the same question in chat. Both explanations
showed Goji Berry Jelly at 6.3/100, estimated scenario range 3.2–11.8, with the
four-minute hot-water assumption. Mango restriction and allergen notices remained
visible. Direct file-URL browser testing was blocked by the browser URL policy;
no workaround was used. The embedded preview loaded successfully through the
local server, and local recommendation logic is covered by automated tests.

37 existing regressions, 23 provider tests using mocks, 9 heat-model tests and 7
candidate-selection tests passed, plus the English display check. Rebuilding
into a separate directory reproduced current data, runtime, embedded preview,
candidate manifest and documentation (comparing text independent of line endings).
These checks do not establish empirical heat-score accuracy or approve candidate
recipe safety/rights. Historical checks below concern earlier versions.


## Ingredient-first release, 2026-10-01

Verified in the in-app browser at localhost:8893 with no API keys: ingredient-first welcome, blueberry/yogurt/cold/no-cooking request, correct added recipe and source attribution, 95-ingredient browser, search and ingredient-button-to-chat flow. Provider checks use mocks; live availability not verified.


## Second candidate review, 2026-10-01

In-app browser at localhost:8895: catalogue exposes 131 ingredients; broccoli returns the new quinoa/broccoli recipe with correct ingredient quantities, methods and provenance; following with no cooking returns no match and preserves broccoli. No live provider keys configured. Prior 85 recipes unchanged apart from rebuilt ingredient IDs; JSON, JSONL and UI data agree.
