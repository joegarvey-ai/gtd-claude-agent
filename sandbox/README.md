# Sandbox

A pre-populated Obsidian vault for testing, eval runs, and development without touching your real notes.

## What's here

```
sandbox/
└── vault/
    ├── 00 Inbox/              ← Sample captures to process
    │   └── Bee/              ← (empty — populated by test runs)
    ├── 01 Next Actions/
    │   ├── Deep Work/        ← (empty)
    │   └── Quick Wins/       ← (empty)
    ├── 02 Personal Projects/ ← Sample project with next action
    ├── 03 Family & Personal Planning/
    ├── 04 Someday Maybe/
    ├── 05 Reference/
    │   ├── Bee/_raw/         ← (empty — put test captures here)
    │   └── Meeting Notes/    ← (empty — populated by Bee processing)
    ├── 06 Waiting For/       ← Sample waiting-for item
    └── People/               ← Sample People note
```

## Usage

### For evals

Point the eval runner at this vault instead of your real one:

```bash
cd evals
VAULT_PATH=../sandbox/vault ANTHROPIC_API_KEY=sk-... npm run eval
```

### For validators

```bash
cd validators
npx tsx src/cli.ts all ../sandbox/vault ..
```

### For devcontainer

The devcontainer mounts `sandbox/vault` at `/vault` automatically. All tools inside the container use this path by default.

### For manual testing

Drop raw Bee captures in `sandbox/vault/05 Reference/Bee/_raw/` and trigger processing:
1. Copy a `.md` capture file into `_raw/`
2. Create a sentinel file in `.kiro/bee-inbox/`
3. Run the Bee Processor or let the Kiro hook fire

The sandbox is disposable — reset it with `git checkout sandbox/`.

## Rules

- The sandbox is committed to git (it's part of the repo)
- It should always have the correct GTD folder structure
- Sample content should be realistic but never contain real personal data
- Reset to a clean state before committing (no test run artifacts)
