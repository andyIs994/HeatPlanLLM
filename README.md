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

This is still a local rule-based prototype, with optional Groq intent parsing and a short generated introduction. Set GROQ_API_KEY on the server to enable that adapter. Free-form recipe rewriting is not implemented. No real Groq request was needed for this language edition. The English package is separate from the original Chinese version and has not been integrated into the Desktop HeatPlan project.

Files:

- ui/preview.html: standalone English chat.
- ui/RecipeChatbox.vue: Vue 3 / Vite component and supporting modules.
- data/recipes.json and recipes.jsonl: English recipe displays with unchanged screening annotations and provenance.
- STANDARD_RECIPES.md: readable English catalogue.
- input/base_v4: frozen source material for this translation; not the live recommendation data.
- pipeline/build_english.py and translations_en.py: reproducible localization.

To rebuild, with Python 3.10+:

    python -B pipeline/build_english.py --output ../heatplan_recipe_data_v4_en_rebuilt

Code uses MIT. Recipe text, translations and annotations use CC BY-SA 4.0; see ATTRIBUTION_AND_LICENSE.md.
