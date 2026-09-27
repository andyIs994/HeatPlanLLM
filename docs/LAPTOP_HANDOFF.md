# Continue on another laptop

The current application is on the Staging branch. The main branch does not yet contain the application. Clone Staging explicitly:

```sh
git clone --branch Staging https://github.com/andyIs994/HeatPlanLLM.git
cd HeatPlanLLM
node pipeline/server.mjs
```

Install Node.js 22 or later if it is not available. This standalone server uses Node built-in modules; no npm install is required. Open http://127.0.0.1:8880. For the offline preview, open ui/preview.html directly. Python 3.10+ is only needed to rebuild the dataset or embedded preview.

Authenticate Git with an account that has access to this private repository. Browser login and local Git authentication are separate. NVIDIA is the primary model service and Groq is the backup. Optional keys must be configured separately on each machine and must never be committed. See [provider setup](LLM_PROVIDERS.md): copy `.env.example` to `.env` if it does not exist, fill keys locally and start with `node --env-file=.env pipeline/server.mjs`. The local rule-based fallback works without keys. No live model quality results have been verified.

Before starting work, commit or stash existing local changes, then:

```sh
git switch Staging
git pull --ff-only origin Staging
```

After making changes:

```sh
node pipeline/test_v4.mjs
node pipeline/check_english.mjs .
node --test pipeline/test_providers.mjs
git status
git add <files-you-intend-to-share>
git commit -m "Describe the change"
git push origin Staging
```

If a pull cannot fast-forward, inspect the divergent commits and resolve them before pushing. Do not force-push to synchronize laptops. GitHub only contains committed and successfully pushed files; it does not automatically synchronize edits.

Current scope: 58 recipe records, English chat, ingredient-based allergy screening, transparent heat ranking, and NVIDIA/Groq adapters with tested failover using mocks. Free-form recipe rewriting and unrestricted multilingual support remain future work.

The current ranking uses cooking heat v2; see COOKING_HEAT.md for annotations and checks. A separate 150-entry Kaggle candidate manifest is synced through Git, but its full source text remains local and is not active in chat. Follow KAGGLE_CANDIDATES.md to download the audited source archive and reconstruct the local candidate data on another laptop.
