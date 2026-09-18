# HeatPlan · English chat edition

An English version of the v0.4 prototype. The interface, conversation replies, preference labels, allergen reminders and all 58 recipe displays are in English. Traditional Vietnamese and Italian recipe names remain unchanged. The five Chinese recipe titles, ingredients and methods have English translations; source text and attribution are retained.

Open ui/preview.html directly for the offline version, or run:

    node pipeline/server.mjs

Then visit http://127.0.0.1:8880.

Try:

1. Chinese food, mango allergy, cold
2. Another one
3. Make it room temperature
4. I have cucumber
5. Why this recipe?

The chat keeps allergy restrictions when changing dishes or temperature. Use New chat to start over.

The 58 records, recipe quantities, heat weights and removed recipes match v0.4. Cold dishes rank before room-temperature dishes and hot dishes unless a temperature is explicitly requested. Within each group, more cooking heat lowers the score.

The server supports **NVIDIA first, Groq backup, then local rules** for intent parsing and a short generated introduction. Recipe filtering and ranking remain local and transparent. Copy `.env.example` to `.env`, fill your own keys locally, then run `node --env-file=.env pipeline/server.mjs` with Node.js 22 or later. See [provider setup and failure behaviour](docs/LLM_PROVIDERS.md). Without keys, the local prototype still works. Provider integration has been tested with mocks; live API performance has not been verified. Free-form recipe rewriting is not implemented. This standalone prototype has not been integrated into the Desktop HeatPlan project.

Files:

- ui/preview.html: standalone English chat.
- ui/RecipeChatbox.vue: Vue 3 / Vite component and supporting modules.
- data/recipes.json and recipes.jsonl: English recipe displays with unchanged screening annotations and provenance.
- STANDARD_RECIPES.md: readable English catalogue.
- input/base_v4: frozen source material for this translation; not the live recommendation data.
- pipeline/build_english.py and translations_en.py: reproducible localization.
- pipeline/llm.mjs and provider-router.mjs: server-only adapters and per-turn failover.
- docs/LLM_PROVIDERS.md: API setup, request routing, verification and limitations.
- docs/LAPTOP_HANDOFF.md: clone and synchronize the Staging branch on another laptop.

To rebuild the dataset and current application into a separate folder, with Python 3.10+:

    python -B pipeline/build_english.py --output ../heatplan_recipe_data_v4_en_rebuilt

After changing UI modules or templates, regenerate the embedded preview with `python -B pipeline/build_preview.py`.

Checks (no live API requests):

    node pipeline/test_v4.mjs
    node pipeline/check_english.mjs .
    node --test pipeline/test_providers.mjs

Code uses MIT. Recipe text, translations and annotations use CC BY-SA 4.0; see ATTRIBUTION_AND_LICENSE.md.

SHA256SUMS.txt records canonical Git file bytes for this snapshot; working-copy line endings may differ on Windows.
