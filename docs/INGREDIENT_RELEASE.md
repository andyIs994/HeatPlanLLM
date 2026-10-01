> Historical first release. Current counts and remaining-candidate decisions: [second review](REVIEW_ROUND2.md).

# Ingredient-first release, 1 October 2026

The active collection now contains 85 recipes: the existing 58 Wikibooks records plus 27 individually reviewed preparations based on the cached Kaggle candidate facts. The dictionary contains 109 food identifiers, including food families and prepared forms. There are 95 selectable ingredients with at least one standalone active recipe. These are not 109 unique botanical species.

## What was reviewed and admitted

The added candidate numbers are 1, 8, 20, 22, 26, 29, 34, 38, 39, 53, 57, 67, 74, 79, 83, 89, 91, 97, 98, 101, 104, 111, 117, 136, 137, 149 and 150. Their cached full directions were read against ingredient quantities. Each uses no active heating in the listed preparation. Prepared toasted nuts and frozen fruit are accepted only in the specified ready-to-use state; this does not measure their upstream production or freezing energy. Always follow package preparation requirements.

Display titles and directions were newly worded from preparation facts; ingredient quantities, source URLs, CSV record references and review metadata are retained. No source images or full upstream directions are distributed. The Allrecipes material is not relabelled as Wikibooks CC BY-SA, and no blanket upstream rights clearance is claimed. This is an assistant data review, not a cooking trial, expert food-safety review or live-page verification.

The remaining 123 candidates are deferred, not certified as failed or passed. `data/candidate_release_review.json` records all 150 dispositions. Several ingredient blocks are visibly incomplete, including the burrata salad whose directions mention dressing ingredients absent from the ingredient field. These were not repaired by inventing quantities. The original candidate manifest is an immutable historical shortlist, not the live catalogue.

## Matching and coverage

`pipeline/recommendation.mjs` contains multilingual food aliases and matching rules. `data/recipes.json` carries recipe-level ingredient IDs derived only from ingredient text and preserved allergen annotations, not from incidental mentions in directions. `data/ingredient_catalog.json` maps selectable food IDs to recipe IDs. `docs/INGREDIENT_COVERAGE.md` is the readable coverage table.

Plant milks no longer automatically add dairy to a request. Explicit allergen annotations remain authoritative for the existing standard allergen families. Unknown allergies still require clarification. Compound ingredients with unverified labels remain excluded when an allergy restriction is present. Coverage does not guarantee a result for every combination of ingredients, temperatures and allergies.

The 14 recognition-only terms without a standalone match remain recognised for restrictions, but are not advertised in the ingredient browser. This prevents dead-end selectable ingredients without weakening allergy screening.

The chat remains the primary input. The optional, collapsed ingredient browser helps users discover covered foods. `no cooking`, `no heat`, `no oven` and `不开火` impose a conservative no-active-heating restriction that persists across turns. Cuisine is optional. Ingredient preferences currently require all specified ingredients; pantry overlap ranking, automatically generated substitutions and exact time-budget filtering are not implemented.

## Rebuild and validate

The checked-in active recipe JSON is the reviewed source of truth. Rebuild its ingredient index and browser bundle after editing it:

```sh
node pipeline/build_ingredient_index.mjs
python pipeline/build_preview.py
node pipeline/test_v4.mjs .
node --test pipeline/test_heat.mjs pipeline/test_ingredients.mjs pipeline/test_providers.mjs
node pipeline/check_english.mjs .
```

`build_english.py` reconstructs the historical 58-recipe translation. Do not run it over this active release. Live NVIDIA/Groq availability has not been tested in this release; provider failover checks use mocks.
