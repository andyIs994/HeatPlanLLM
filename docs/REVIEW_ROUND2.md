# Remaining 123 candidates: completed review

Reviewed all 123 previously deferred records using the cached ingredient blocks and full directions. Added 109 preparations, held 14 with explicit reasons. The catalogue now contains 194 recipes: 58 original Wikibooks recipes and 136 reviewed Kaggle-derived preparations. We did not add arbitrary recipes to reach 300.

The dictionary now recognises 141 food identifiers. The ingredient browser offers 131, each linked to at least one standalone active recipe. These include base foods, families and prepared states, not 141 unique biological ingredients. Coverage increased by 36 selectable terms from the preceding release. Recognition-only terms remain excluded from the browser.

## Label alignment

- Existing user temperature decisions are retained, including candidate 66 as warm in the hot ranking group.
- When no source chilling/heating or user decision specified final serving temperature, room temperature is the explicit default, not a measured fact. Chilled watermelon in candidate 92 establishes cold serving.
- Active heating is separate from final serving temperature. Of the 109 additions, 84 have no active heating in the listed preparation and 25 have positive heating stages. Boiling water and oven warm-up are counted; chilling, freezing and heat-off rests are excluded.
- Source durations and assumed scenario ranges are distinguished. Unknown active duration never becomes zero. Historical method-only fields are compatibility metadata; ranking uses cooking-heat-v2.
- Prepared ingredients retain their required states: cooked chicken, hard-boiled eggs, cooked rice, toasted nuts and cooked/canned beans. Zero listed heating does not include upstream preparation and manufacture.
- Source waiting periods and required ice-cream equipment are displayed. No-active-heat does not mean an instant meal.
- Unrecognised cuisine categories map to International for runtime compatibility; original source hints remain metadata. Cuisine is not the focus of coverage.
- Allergen families were screened against ingredient lists. Compound-product uncertainty remains a blocking condition when allergies are supplied. Source text is not an allergy certification.

## Held records

| Candidate | Original title | Reason |
|---|---|---|
| 3 | Peach Ice Cream | Raw eggs are blended and frozen without a cooking or pasteurised-egg specification. Requires a separately verified preparation before release. |
| 10 | Perfect Summer Fruit Salad | Only dressing ingredients are present; pineapple, strawberries, kiwi, bananas, oranges, grapes and blueberries have no quantities. |
| 14 | Homemade Peach Tea | Tea bags and their quantity are absent; the directions require another six cups of water not listed in the ingredient block. |
| 25 | Summer Salad with Burrata, Tomatoes, and Nectarines | Dressing oil, vinegar, mustard, honey, salt and pepper are absent from the ingredient block. |
| 43 | Thai-Inspired Confetti Salad | Green beans are used without a specified cooking/preparation stage. Hold until the intended ready-to-eat preparation is verified. |
| 46 | Strawberry Spinach Salad | Only dressing is listed; strawberries, spinach and almonds have no quantities. |
| 56 | Jamie's Cranberry Spinach Salad | Oil, sugar, both vinegars, sesame, poppy seeds, onion and paprika for dressing are absent. |
| 102 | Kale, Quinoa, and Avocado Salad with Lemon Dijon Vinaigrette | Olive oil, lemon juice, Dijon mustard, salt and pepper for the dressing have no quantities. |
| 106 | Jicama Mango Salad with Cilantro and Lime | Cilantro, lime juice, honey, salt and cayenne used in the dressing are absent. |
| 112 | Mexican Green Papaya Salad | Papaya, black beans, corn and red pepper forming the salad are absent. |
| 118 | Spinach Salad with Chicken, Avocado, and Goat Cheese | White wine vinegar, olive oil and Dijon mustard for dressing are absent. |
| 122 | Lemon Pretzel Salad with Mango and Kiwi | Only crust ingredients are present; the cream layer, gelatin layer and fruit quantities are absent. |
| 126 | Persimmon, Pomegranate, and Massaged Kale Salad | Only nut topping is listed; kale, persimmon, pomegranate and dressing quantities are absent. |
| 138 | Bionicos (Mexican Fruit Bowls) | Only cream sauce is listed; fruit, granola, raisins and coconut quantities are absent. |

## Evidence and reproduction

`data/candidate_release_review.json` accounts for all 150 original candidates; `data/review_round2_summary.json` identifies the 109 additions and 14 holds. Each active recipe keeps its original title, URL, CSV record references, review choices, and heating evidence. Display directions are newly worded from preparation facts, not copied upstream prose. No source images or blanket upstream licensing claims are added.

The manually authored decisions are encoded in `pipeline/review_candidates_round2.py`. Reproduction requires the local frozen `candidates_reviewed.json` from the mentor review package, which contains the original candidate material and is not redistributed in this repository:

```sh
python pipeline/review_candidates_round2.py --review-source /path/to/candidates_reviewed.json
node pipeline/build_ingredient_index.mjs
python pipeline/build_preview.py
```

This script applies explicit reviewed decisions. It is not a trained classifier and does not automatically approve unfamiliar future records. The data review does not claim live-page verification, kitchen testing or clinical validation.

## Validation

51 provider, cooking-heat, ingredient and second-review tests; 37 chat regressions; 7 Kaggle pipeline tests passed. English display checks cover all 194 records. Every selectable ingredient was exercised through the actual chat parser and recommendation engine. New tests cover withheld records, warm labels, boiling water, heat-off egg rest, plant cream, tomato-name collisions, prepared states, and histories longer than 100 recipes. External LLM calls remain mocked in the test suite.
