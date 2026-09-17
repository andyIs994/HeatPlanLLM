# HeatPlan recipe assistant — LeanKit card drafts

Prepared on 14 September 2026. These are local English drafts for manual entry into LeanKit, not existing board records. Reference IDs below are draft identifiers. Suggested ownership is not an assignment. Dates and estimates should be agreed by the team.

Completed cards describe implemented, locally verified work. Use Ready for Review instead of Done if the team requires peer review; peer acceptance has not been recorded. Evidence paths are relative to the prepared `heatplan_LLM` repository unless otherwise stated. GitHub publication and PGP submission have not been verified.

## Completed implementation

### HP-D01 — Curate and document the current recipe dataset

**Suggested status:** Done / Ready for Review  
**Type:** Data preparation  
**Suggested owner:** MAI student

**Description:** Prepare a traceable recipe library for the English recipe assistant, retaining standard ingredients, preparation steps, source revisions and reuse metadata.

**Completed scope / acceptance evidence:**
- The current dataset contains 58 unique records across seven cuisines, including supporting sauces and base recipes.
- Each record retains source and licence metadata.
- Bánh chưng, Pasta Marinata and Minestrone alla Capucina are absent from the active dataset.
- Ingredient/step adaptations and English localization metadata are retained.

**Evidence:** `data/recipes.json`, `ATTRIBUTION_AND_LICENSE.md`, `STANDARD_RECIPES.md`, `pipeline/build_english.py`, `pipeline/translations_en.py`.

**Boundary:** This is reference data, not a trained model. The 58-record count alone does not establish the original data-quality KPI percentage.

### HP-D02 — Implement serving-temperature and cooking-heat ranking

**Suggested status:** Done / Ready for Review  
**Type:** Recommendation baseline  
**Suggested owner:** MAI student

**Description:** Implement a transparent baseline that prioritises serving-temperature preferences and uses preparation-method weights within temperature groups.

**Completed scope / acceptance evidence:**
- Default preference is cold, then room temperature, then hot; explicit temperature requests are respected.
- Boiling contributes 1 and grilling contributes 3; other configured methods have documented weights.
- Repeated methods within one group count once; distinct groups accumulate.
- Within the same temperature tier, additional cooking heat lowers the ranking score.

**Evidence:** `pipeline/recommendation.mjs`, heat fields in `data/recipes.json`, ranking cases in `pipeline/test_v4.mjs`.

**Boundary:** The weights are project heuristics, not measured thermal exposure or clinically validated cooling effects.

### HP-D03 — Implement ingredient-based allergen screening and clarification

**Suggested status:** Done / Ready for Review  
**Type:** Constraint handling  
**Suggested owner:** MAI student

**Description:** Apply recognised allergy restrictions before recommendation and preserve uncertainty when the input or recipe composition cannot be resolved.

**Completed scope / acceptance evidence:**
- Supported allergen names and aliases, including the mango example, are recognised.
- Known conflicts are excluded before ranking; tested unknown-allergen cases request clarification.
- Multiple restrictions persist when changing dishes, cuisine or temperature.
- Responses include an allergen reminder; exhausting available choices does not relax restrictions.

**Evidence:** `pipeline/chat-engine.mjs`, `pipeline/recommendation.mjs`, allergen fields in `data/recipes.json`, related tests in `pipeline/test_v4.mjs`.

**Boundary:** Coverage is limited to supported rules and ingredient information; screening is not an allergen-free guarantee.

### HP-D04 — Build a single-input recipe chat with conversation state

**Suggested status:** Done / Ready for Review  
**Type:** Prototype interaction  
**Suggested owner:** MAI student; frontend contribution to be recorded if applicable

**Description:** Replace the mandatory dropdown workflow with one conversation input and retain user constraints across follow-up messages.

**Completed scope / acceptance evidence:**
- The chat preview has one composer and no mandatory dropdown selectors.
- A request such as “Chinese food, mango allergy, cold” returns a matching standard recipe.
- “Another one” and temperature changes preserve allergy restrictions.
- “Why this recipe?” explains the previous selection; New chat resets state.
- Unsupported recipe reformulation is acknowledged rather than represented as completed.

**Evidence:** `ui/preview.html`, `ui/RecipeChatbox.vue`, `pipeline/chat-engine.mjs`, `BROWSER_QA.md`, conversation tests.

**Boundary:** This is a standalone prototype, not yet an integrated HeatPlan feature.

### HP-D05 — Deliver the English prototype and regression checks

**Suggested status:** Done / Ready for Review  
**Type:** Localization and testing  
**Suggested owner:** MAI student

**Description:** Deliver English interface text and recipe displays while preserving original-source metadata, restrictions and ranking behaviour.

**Completed scope / acceptance evidence:**
- All 58 recipe displays and the tested conversation flow use English; traditional dish names are preserved.
- The original Chinese prototype remains separate.
- The local functional suite passes 37 tests.
- The English check passes for multi-turn behaviour, allergy retention, hot-weather interpretation and recipe display language.

**Evidence:** `pipeline/check_english.mjs`, `pipeline/test_v4.mjs`, `validation_log.txt`, `BROWSER_QA.md`. Commands: `node pipeline/test_v4.mjs` and `node pipeline/check_english.mjs .`.

**Boundary:** Display checks do not establish expert translation accuracy or unrestricted multilingual understanding.

### HP-D06 — Implement the optional Groq adapter and mocked fallback tests

**Suggested status:** Done / Ready for Review  
**Type:** AI integration infrastructure  
**Suggested owner:** MAI student

**Description:** Implement an optional server-side model adapter for structured intent extraction and a short introduction grounded in the selected recipe.

**Completed scope / acceptance evidence:**
- Model-produced structured fields are validated before use.
- The adapter supports intent extraction and a recipe introduction.
- Mocked model responses exercise the configured path.
- Mocked service failure falls back to local processing without dropping tested restrictions.

**Evidence:** `pipeline/groq.mjs`, `pipeline/server.mjs`, Groq cases in `pipeline/test_v4.mjs`.

**Boundary:** No verified live API results, model-quality metrics or free-form recipe rewriting are claimed.

### HP-D07 — Prepare the PGP data-only evidence package

**Suggested status:** Done / Ready for Review  
**Type:** Data documentation  
**Suggested owner:** MAI student

**Description:** Prepare a compact submission artifact containing current application data and minimal supporting documentation.

**Completed scope / acceptance evidence:**
- The archive contains only `recipes.json`, `DATA_NOTES.md` and `SOURCES_AND_LICENSE.md`.
- The recipe JSON is byte-identical to the current English application dataset.
- The archive contains 58 records and no application code or historical input directory.

**Evidence:** Adjacent output artifact `PGP_Recipe_Data_Only_2026-09-14.zip`.

**Boundary:** Package preparation is complete; submission to PGP is not verified.

## Proposed next iteration

**Iteration outcome:** Demonstrate an integrated recipe chat using a live model for supported requests, with preserved restrictions and a measured comparison against the local baseline. Keep the 58-record library stable for evaluation. English, Vietnamese and Italian are the proposed evaluation languages, subject to available language reviewers.

Targets below are proposed project acceptance conditions, not university requirements or achieved results. Freeze the numerical quality targets before evaluating held-out cases.

### HP-N01 — Confirm revised AI scope and KPI measurement

**Suggested status:** To Do  
**Priority:** High  
**Suggested owner:** MAI student  
**Depends on:** None

**Description:** Align the original action plan with the current recipe assistant and agree on measurable work for this iteration.

**Acceptance criteria:**
- Record current implementation, intended interaction languages and next-iteration exclusions.
- Define the original-batch denominator and usability checklist before claiming the data-quality KPI.
- Separate intent-extraction metrics, ranking metrics and functional-test results; do not equate them with the previous classification F1 target.
- Record team/mentor feedback and any unresolved KPI change. Do not describe a proposal as approved.
- Decide whether learned retrieval/ranking is required this iteration, later, or outside the agreed scope.

**Evidence to attach:** Revised action plan, metric definitions and decision notes.

### HP-N02 — Create a reviewed multilingual evaluation set

**Suggested status:** To Do  
**Priority:** High  
**Suggested owner:** MAI student with language reviewers  
**Depends on:** HP-N01

**Description:** Create repeatable test conversations that distinguish interaction language from cuisine preference and expose errors in constraints and follow-up handling.

**Acceptance criteria:**
- Proposed scope: 30 scenario families, each expressed in English, Vietnamese and Italian, giving 90 conversations. Record any scope change before evaluation.
- Include explicit cuisine, hot weather versus hot food, multiple allergies, negation, ambiguity, no-match cases, cross-language cuisine requests and follow-up corrections.
- Label expected intent fields, state updates and clarification/no-match outcomes; have language meaning reviewed and record unreviewed cases separately.
- Split 20 families for development and 10 for held-out evaluation; all translations and paraphrases of a family stay in one split.
- Lock the test manifest before prompt tuning and report counts by language. The small held-out sample is preliminary evidence, not broad reliability proof.

**Evidence to attach:** Versioned conversations, annotation guide, reviewer notes and split manifest.

### HP-N03 — Validate live Groq intent extraction and failure handling

**Suggested status:** To Do  
**Priority:** High  
**Suggested owner:** MAI student / backend contributor  
**Depends on:** HP-N01; HP-N02 development cases

**Description:** Run the implemented adapter against a real configured model and verify that application constraints remain authoritative.

**Acceptance criteria:**
- Configure credentials on the server; record the actual model identifier, prompt version and configuration without committing secrets.
- Demonstrate real requests for each supported interaction language and validate structured responses.
- Unknown/ambiguous critical fields trigger clarification; changing cuisine or temperature does not silently erase an existing allergy.
- Exercise timeout, service error, malformed output and unavailable-model handling through controlled tests; preserve local fallback.
- Separate real-service results from injected or mocked failures in the report.

**Evidence to attach:** Redacted live-run results, configuration example, error-handling results and commit reference.

### HP-N04 — Return grounded responses in the requested language

**Suggested status:** To Do  
**Priority:** High  
**Suggested owner:** MAI student with language reviewers  
**Depends on:** HP-N03

**Description:** Extend the current English response flow to the agreed languages while preserving the selected standard recipe and its restrictions.

**Acceptance criteria:**
- Response language is separate from requested cuisine; an Italian-language request for Vietnamese food remains Vietnamese cuisine.
- The selected recipe ID and source are retained; ingredients, quantities and preparation steps are not silently reformulated.
- Recipe translation and allergen reminders are reviewed for the agreed demonstration cases; model-generated fluency alone is not treated as correctness.
- Unsupported output or validation failure yields an explicit fallback or clarification, with no invented recipe facts.
- Explain selection using recorded fields and scores, without requesting or presenting hidden model reasoning.

**Evidence to attach:** Reviewed examples in each language, grounding checks, failure cases and prompt/code version.

### HP-N05 — Integrate the chat into the HeatPlan application

**Suggested status:** To Do  
**Priority:** High  
**Suggested owner:** Frontend/backend contributors with MAI student  
**Depends on:** HP-D04; agreed API contract. Live model verification depends on HP-N03.

**Description:** Connect the working recipe component and server API to the team's actual HeatPlan application.

**Acceptance criteria:**
- The agreed HeatPlan environment exposes the single-input chat and recipe response.
- Loading, clarification, no-match and service-fallback states are visible and understandable.
- Separate user sessions do not share conversation restrictions; New chat resets only the current conversation.
- API credentials remain server-side, and the agreed deployment supports the required backend route.
- A teammate completes the documented smoke flow in the integrated environment; attach the actual URL or run instructions and review result.

**Evidence to attach:** Integration commit/PR, API contract, environment instructions and teammate smoke-test record.

### HP-N06 — Compare the local baseline and live model on held-out cases

**Suggested status:** To Do  
**Priority:** High  
**Suggested owner:** MAI student  
**Depends on:** HP-N02, HP-N03, HP-N04

**Description:** Measure whether model-assisted understanding improves the current baseline without losing restrictions or recipe grounding.

**Acceptance criteria:**
- Freeze parser/prompt versions and proposed quality thresholds using development data before opening held-out results.
- Evaluate both methods on the same held-out conversations and dataset version.
- Report intent-field accuracy, complete-request accuracy, allergy-state retention, clarification/no-match performance, unsupported recipe changes, fallback frequency and response latency; include sample counts and language breakdowns.
- Use zero known-allergen violations on the fixed checked cases as a release gate, without interpreting that as universal safety.
- Record regressions and the decision to retain, revise or disable the model path; do not require a positive result to report the experiment honestly.
- Keep the 37-test regression suite passing. If held-out failures guide tuning, label those cases as development/regression data and obtain new independent confirmation cases.

**Evidence to attach:** Evaluation runner, locked manifest, results table, error analysis and decision note.

### HP-N07 — Publish the repository and submit evidence

**Suggested status:** In Progress — local repository prepared; external actions unverified  
**Priority:** Medium  
**Suggested owner:** MAI student

**Description:** Publish the prepared project to the intended GitHub repository and submit the data-only package to PGP.

**Acceptance criteria:**
- Verify the remote repository contains the intended project files and a readable README with run instructions.
- Confirm source attribution is included and credentials are excluded.
- Upload the data-only archive to the agreed PGP location and verify that it is accessible.
- Add actual repository/commit and submission links to the relevant LeanKit cards.

**Evidence to attach:** Verified GitHub URL/commit and PGP submission record.

## Later backlog — scope decision required

- **Compare semantic retrieval or a learned ranking model:** Create reviewed recipe-relevance labels, evaluate comparable baselines, and use NDCG@5/Hit@5 if ranking is the agreed task. This is separate from intent-extraction evaluation; training has not been performed.
- **Support requested recipe adaptations:** Define permissible substitutions and validate ingredients, quantities, preparation and allergy implications. Keep this separate from multilingual translation and standard-recipe recommendation.
- **Expand the recipe library:** Add sources only after recording a concrete coverage gap; version and assess the new batch separately.

## Board use

Suggested lanes: Backlog → To Do → In Progress → Ready for Review → Done. Use one card for one reviewable outcome. Completed cards should link actual evidence and retain limitations. Do not mark entire earlier MAI work packages complete merely because one prototype subtask is finished. HP-N07 is separate from HP-D07 because preparing an archive and submitting it are different outcomes.
