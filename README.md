# HeatPlan · English chat edition

An English version of the v0.4 prototype. The interface, conversation replies, preference labels, allergen reminders and all 194 recipe displays are in English. Traditional Vietnamese and Italian recipe names remain unchanged. The five Chinese recipe titles, ingredients and methods have English translations; source text and attribution are retained.

Open ui/preview.html directly for the offline version, or run:

    node pipeline/server.mjs

Then visit http://127.0.0.1:8880.

Try:

1. I have blueberries and yogurt, cold, no cooking
2. Another one
3. Make it room temperature
4. I have cucumber
5. Why this recipe?

The chat keeps allergy restrictions when changing dishes or temperature. Use New chat to start over.

The original 58 recipes and retirement decisions are retained, with 136 reviewed preparations added. There are 141 recognised food identifiers and 131 selectable ingredients, each linked to at least one standalone recipe. See [the latest review](docs/REVIEW_ROUND2.md) and [ingredient coverage](docs/INGREDIENT_COVERAGE.md). Cold dishes rank before room-temperature dishes and hot dishes unless a temperature is explicitly requested. Within each group, the new [cooking heat v2 score](docs/COOKING_HEAT.md) uses method intensity and active heating duration. Explanations disclose assumed timings and scenario ranges; chilling and resting are excluded. This is a product heuristic, not measured heat or a health rating.

The historical [150-recipe Kaggle shortlist](data/candidates/kaggle_summer_manifest.md) contains 67 salads, 66 drinks and 17 desserts. Across two review rounds, 136 preparations have been admitted with new display wording; 14 are held with specific reasons. The historical shortlist itself is not loaded into chat. See [source handling and reconstruction](docs/KAGGLE_CANDIDATES.md). Full candidate source text is generated locally and is not stored in Git.

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

To reconstruct the historical 58-recipe translation into a separate folder, with Python 3.10+ (this does not include the ingredient-first additions):

    python -B pipeline/build_english.py --output ../heatplan_recipe_data_v4_en_rebuilt

After changing UI modules or templates, regenerate the embedded preview with `python -B pipeline/build_preview.py`.

Checks (no live API requests):

    node pipeline/test_v4.mjs
    node pipeline/check_english.mjs .
    node --test pipeline/test_providers.mjs
    node --test pipeline/test_heat.mjs pipeline/test_ingredients.mjs pipeline/test_review_round2.mjs
    python -B pipeline/test_kaggle.py

Code uses MIT. The 58 Wikibooks recipes, translations and annotations use CC BY-SA 4.0; see ATTRIBUTION_AND_LICENSE.md. Kaggle candidate source rights are tracked separately and are not covered by that statement.

SHA256SUMS.txt records canonical Git file bytes for this snapshot; working-copy line endings may differ on Windows.
