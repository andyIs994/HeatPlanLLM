# Continue on another laptop

The current application is on the Staging branch. The main branch does not yet contain the application. Clone Staging explicitly:

```sh
git clone --branch Staging https://github.com/andyIs994/HeatPlanLLM.git
cd HeatPlanLLM
node pipeline/server.mjs
```

Install Node.js if it is not available. This standalone server uses Node built-in modules; no npm install is required. Open http://127.0.0.1:8880. For the offline preview, open ui/preview.html directly. Python 3.10+ is only needed to rebuild the dataset.

Authenticate Git with an account that has access to this private repository. Browser login and local Git authentication are separate. The Groq API key is optional, must be configured separately on each machine as the GROQ_API_KEY environment variable, and must never be committed. The local rule-based fallback works without it. No live Groq quality results have been verified.

Before starting work, commit or stash existing local changes, then:

```sh
git switch Staging
git pull --ff-only origin Staging
```

After making changes:

```sh
node pipeline/test_v4.mjs
node pipeline/check_english.mjs .
git status
git add <files-you-intend-to-share>
git commit -m "Describe the change"
git push origin Staging
```

If a pull cannot fast-forward, inspect the divergent commits and resolve them before pushing. Do not force-push to synchronize laptops. GitHub only contains committed and successfully pushed files; it does not automatically synchronize edits.

Current scope: 58 recipe records, English chat, ingredient-based allergy screening, transparent heat ranking, and optional Groq adapter with mocked tests. Free-form recipe rewriting and unrestricted multilingual support remain future work. Planning cards are in docs/LeanKit_Current_and_Next_Iteration.md; historical status statements in those drafts describe the date they were prepared.
