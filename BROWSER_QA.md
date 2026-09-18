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
