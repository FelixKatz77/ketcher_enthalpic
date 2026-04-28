# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is Ketcher

Ketcher is an open-source **chemical structure editor** built with TypeScript and React. It renders molecules, reactions, macromolecules, and monomers using a custom MVC architecture over SVG.

## Fork & Branching Strategy

This repository is a **fork** of `epam/ketcher` (Enthalpic-specific build). EPAM continues to develop upstream independently, so the branch layout keeps our work cleanly separable from theirs.

### Remotes

- `origin` → `FelixKatz77/ketcher_enthalpic` (this fork; push here)
- `upstream` → `epam/ketcher` (read-only; never push here)

### Branch roles

- **`master`** — pure mirror of `upstream/master`. Never commit directly. Only ever advances via fast-forward from upstream.
- **`enthalpic`** — integration branch holding shipped Enthalpic code. This is what gets deployed/built. Features merge into here, not into `master`.
- **`feature/<name>`** — one branch per feature, branched off `master`. Short-lived. Rebased onto `master` whenever upstream is synced.

### Sync upstream from EPAM

```bash
git checkout master
git fetch upstream
git merge --ff-only upstream/master    # ff-only — fails if master has drifted (which would be a bug)
git push origin master

# Then rebase active feature branches and enthalpic onto the new master:
git checkout feature/<name> && git rebase master
git checkout enthalpic     && git rebase master   # or merge, see "Rebase vs merge" below
```

### Develop a new feature

```bash
git checkout master
git checkout -b feature/<name>
# ...work, commit, push to origin...
git push -u origin feature/<name>
```

When done: rebase onto latest `master`, then merge into `enthalpic`:

```bash
git checkout feature/<name> && git rebase master
git checkout enthalpic && git merge --no-ff feature/<name>
git push origin enthalpic
```

`--no-ff` preserves a merge commit so the feature is identifiable as a unit in the `enthalpic` history (helpful for revert and for upstreaming individual features later).

### Rebase vs merge

- **Rebase** before sharing a branch — keeps history linear. Use on `feature/*` branches before they're merged.
- **Merge** after sharing or for integration into `enthalpic` — `git merge --no-ff` preserves the feature boundary.
- Push rewrites with `git push --force-with-lease`, never plain `--force`.

### Upstreaming to EPAM (if applicable)

Open the PR from `FelixKatz77/ketcher_enthalpic:feature/<name>` → `epam/ketcher:master` via the GitHub UI. Because feature branches are scoped and rebased onto upstream, they're already in a PR-ready shape.

### Rules

- **Never commit to `master`.** It's a mirror, not a workspace.
- **One feature per branch.** Smaller branches rebase more cleanly against upstream churn.
- **`enthalpic` is the deployable line**, not `master`.
- **Use `--force-with-lease`**, never `--force`.

## Monorepo Structure

npm workspaces monorepo (Node >= 24.14.1, npm >= 7):

- **packages/ketcher-core** — domain logic, rendering engine, file format parsers, chemistry algorithms
- **packages/ketcher-react** — React component library (`<Editor />`)
- **packages/ketcher-standalone** — standalone mode (no Indigo backend needed)
- **packages/ketcher-macromolecules** — macromolecule/polymer editor UI
- **example** — reference app; uses Vite for dev, react-app-rewired (Webpack) for production builds
- **example-ssr** — Next.js SSR example
- **example-separate-editors** — example with multiple editor instances
- **demo** — Create React App demo
- **ketcher-autotests** — Playwright E2E test suite

## Build & Development Commands

```bash
# Install (always from root)
npm install

# Build everything
npm run build

# Build only the packages (ketcher-core → ketcher-standalone+ketcher-react → ketcher-macromolecules)
npm run build:packages

# Build individual packages
npm run build:core
npm run build:react
npm run build:standalone
npm run build:macromolecules
```

### Development server

```bash
cd example
npm run dev:standalone   # Vite dev server, standalone mode
npm run dev:remote       # Vite dev server, remote mode (requires Indigo service)
```

**Important**: Vite is used for development, but `react-app-rewired` (Webpack) is used for production builds. Always verify behavior with react-app-rewired before creating a PR:

```bash
# Start packages in watch mode (each in its own terminal)
cd packages/ketcher-core && npm start
cd packages/ketcher-react && npm start
cd packages/ketcher-standalone && npm start

# Then start the example app
cd example && npm run start:standalone   # or start:remote
```

### Serve production builds

```bash
npm run serve:standalone   # http://127.0.0.1:4002
npm run serve:remote       # http://127.0.0.1:4001
npm run serve              # both in parallel
```

## Testing

### Unit tests

```bash
# Run all unit tests across all packages (from root)
npm test

# Run unit tests in a single package
cd packages/ketcher-core
npm run test:unit                    # run all
npm run test:unit -- <pattern>       # run matching file/test name
npm run test:unit -- --watch         # watch mode

# Type checking
npm run test:types
```

### E2E tests (Playwright)

```bash
cd ketcher-autotests
npm install
npx playwright install chromium

npm t                                        # run all tests
npm run test -- canvas                       # run tests matching "canvas"
npm run test:debug                           # run with Playwright debug UI
npm run test -- --update-snapshots           # update screenshots

# Docker-based tests (for Linux-consistent snapshots — required for CI)
npm run docker:build
npm run docker:test
npm run docker:test file_name                # specific file
npm run docker:test file_name:N              # specific test at line N
npm run docker:update file_name:N            # update snapshot for specific test
```

Playwright snapshots for Linux are committed; macOS/Windows snapshots are gitignored.

## Linting & Formatting

```bash
npm run prettier:write          # format all files (all workspaces)
npm run stylelint:fix           # fix CSS/LESS
npm run test:eslint             # check ESLint
npm run test:eslint:fix         # fix ESLint issues
```

Pre-commit hook runs `lint-staged` + `prettier:write`. Pre-push hook runs `npm test` + `npm run test:types`.

## Architecture

### ketcher-core layers

Uses domain-driven design:
- **domain/** — chemical objects: `Atom`, `Bond`, `Struct`, `SGroup`, monomers, stereo labels, reactions
- **application/** — services and business logic: structure providers, file parsers, layout algorithms, `Render` class
- **infrastructure/** — low-level utilities

TypeScript path aliases (`domain/*`, `application/*`, `infrastructure/*`) are configured in tsconfig.

### MVC rendering model

- **Model**: chemical objects with coordinates in Angstrom-like units and Ketcher internal IDs
- **View**: SVG rendering via Paper.js and Raphael; `ReStruct` (render-side struct) mirrors `Struct` for render state
- **Controller**: editor tools, user interaction, Redux actions

### State management (ketcher-react)

Redux + Redux Toolkit. Never mutate Redux state directly — use slices and actions. Use `reselect` for memoized selectors.

### Indigo service

Server-side operations (aromatization, layout, format conversion) require the Indigo Service backend. Pass it via the `apiPath` prop on `<Editor>` or the `api_path` query param. Standalone mode uses a WASM build instead.

## Code Standards

- **TypeScript strict mode** — no `any`, no unjustified non-null assertions
- **React functional components only** — no class components
- **Pure functions** for calculations and coordinate transforms
- **Immutable model objects** — only modify through Redux actions/reducers
- **No new libraries** — do not introduce MobX, RxJS, jQuery, or anything not already in the project
- Magic numbers in chemistry logic must have explanatory comments
- Do not simplify stereochemistry, valence validation, or CFG parsing logic without full understanding

## Windows-specific note

If you encounter "file name too long" errors in Git, run:
```bash
git config --global core.longpaths true
```

## Ketcher Test Conventions
- Imports should come from aliases defined in `ketcher-autotests/tsconfig.json`: `@fixtures`, `@utils`, and `@tests/...`. Do not use deep relative imports.
- The default test entrypoint is `import { Page, test, expect } from '@fixtures';`. `@fixtures` already merges molecules, flex, snake, and sequence canvas fixtures.
- Generated autotests must reuse existing page objects from `ketcher-autotests/tests/pages` and helpers from `ketcher-autotests/tests/utils` whenever possible.
- If a required page object or helper does not exist, create a reusable file under `ketcher-autotests/tests/pages/...` or `ketcher-autotests/tests/utils/...`.
- Do not inline long selector chains or duplicate behavior in the spec.

### Test structure
- Prefer one `test.describe()` block per file.
- Prefer `let page: Page;` at file scope plus `test.beforeAll(async ({ initMoleculesCanvas | initFlexCanvas | initSnakeCanvas | initSequenceCanvas }) => { page = await ...(); })`.
- Close the browser page in `test.afterAll(async ({ closePage }) => { await closePage(); })`.
- Use `initMoleculesCanvas` for micro-mode tests, `initFlexCanvas` for macro flex tests, `initSnakeCanvas` for snake mode, and `initSequenceCanvas` for sequence mode.
- Do not call `waitForPageInit(page)` in tests that already use `init*Canvas` fixtures. Those fixtures create the page, open the app, and apply the canvas mode setup for you.
- Use direct `page` fixture plus `waitForPageInit(page)` mainly for API tests and low-level cases that should not use the canvas presets.
- If most of test cases happens on exact canvas (Molecules, Macromolecules-Flex mode, Macromolecules-Snake mode or Macromolecules-Sequesnce mode) than following fixtures have to be used in test.beforAll block :
  - for starting from Molecules: initMoleculesCanvas
  - for starting from Macromolecules-Flex mode: initFlexCanvas
  - for starting from Macromolecules-Snake mode: initSnakeCanvas
  - for starting from Macromolecules-Sequence mode: initSequenceCanvas
    - Example:
```ts
  test.beforeAll(async ({ initFlexCanvas }) => {
    page = await initFlexCanvas();
  });

  test.afterAll(async ({ closePage }) => {
    await closePage();
  });
```
- If some test changes canvas during execution than test.afterEach block have to be added with fixture that returns canvas back to default canvas defined in test.beforeAll block:
  - for switching to Molecules: MoleculesCanvas
  - for switching to Macromolecules-Flex mode: FlexCanvas
  - for switching to Macromolecules-Snake mode: SnakeCanvas
  - for switching to Macromolecules-Sequence mode: SequenceCanvas
    - Example:
```ts
  test.beforeAll(async ({ initSequenceCanvas }) => {
    page = await initSequenceCanvas();
  });

  test.afterEach(async ({ SequenceCanvas: _ }) => {});

  test.afterAll(async ({ closePage }) => {
    await closePage();
  });
```
- If some test need to be executed on exact canvas different from default one (that is defined at test.beforeAll block) than folloing fixures have to be passed to test as parameter:
  - for running test on Molecules: MoleculesCanvas
  - for running test on Macromolecules-Flex mode: FlexCanvas
  - for running test on Macromolecules-Snake mode: SnakeCanvas
  - for running test on Macromolecules-Sequence mode: SequenceCanvas
    - Example:
```ts
  test('Case 1 — Small molecule positioning rule is not respected when connected to multiple monomers in different chains', async ({
    FlexCanvas: _,
  }) => {
    /*
     * Test task: https://github.com/epam/ketcher/issues/8245
     * Bug: https://github.com/epam/ketcher/issues/7560
     * Version: 3.13.0
     * Description:
     * Small molecule (SM) connected to several monomers from different chains
     * should follow rule: its position in Snake mode must be aligned
     * below the first monomer in the chain.
     *
     * Scenario:
     * 1. Go to Macro → Flex mode
     * 2. Load file: SM-that-has-two-or-more-connections-to-different-monomers.zip
     * 3. Switch to Snake mode
     * 4. Check SM positioning relative to first connected monomer
     *
     * Expected Result:
     * According to requirement 4.2:
     * - When SM has several connections to monomers in different chains,
     *   the connection to the monomer that appears earlier in the Snake chain
     *   must be prioritized.
     * - SM must be placed directly below that monomer.
     */
    await openFileAndAddToCanvasMacro(
      page,
      'KET/Chromium-popup/Bugs/ketcher-3.13.0-bugs/SM-that-has-two-or-more-connections-to-different-monomers.ket',
    );

    // switch to Snake mode
    await MacromoleculesTopToolbar(page).selectLayoutModeTool(LayoutMode.Snake);

    // zoom out to show whole structure
    await CommonTopRightToolbar(page).setZoomInputValue('45');

    // SM expected to appear below the earlier chain monomer — we verify visually
    // target ID may vary depending on import, but SM is usually last monomer
    await takeEditorScreenshot(page);
  });
```

### Canvas and mode setup
- Use `CommonTopRightToolbar(page).turnOnMacromoleculesEditor()` and `turnOnMicromoleculesEditor()` instead of raw mode-switcher clicks.
- Use `MacromoleculesTopToolbar(page)` for layout and polymer switching. Existing helpers include `selectLayoutModeTool(LayoutMode.Flex | Snake | Sequence)`, `rna()`, `dna()`, and `peptides()`.
- For reload/state-persistence tests, prefer existing helpers such as `pageReload(page)`, `pageReloadMicro(page)`, and `clearLocalStorage(page)` from `@utils/common/helpers`.

### Preferred interaction helpers
- For loading structures, prefer helpers from `@utils` such as `openFileAndAddToCanvasAsNewProject`, `openFileAndAddToCanvasAsNewProjectMacro`, `pasteFromClipboardAndAddToCanvas`, and `pasteFromClipboardAndAddToMacromoleculesCanvas`.
- For canvas selection and keyboard operations, prefer `selectAllStructuresOnCanvas`, `copyToClipboardByKeyboard`, `pasteFromClipboardByKeyboard`, `undoByKeyboard`, and related helpers.
- For locating rendered objects, prefer repo helpers such as `getAtomLocator(...)`, `getMonomerLocator(...)`, `getAbbreviationLocator(...)`, and existing page objects.
- For dialogs, toolbars, context menus, and library interactions, use page objects under `tests/pages/...` rather than ad hoc locators.
- Use direct `page.evaluate(...)` only for Ketcher API calls, localStorage checks, or browser APIs that are not already wrapped by helpers.

### Assertions and snapshots
- Use standard Playwright assertions for state and text: `toBeVisible`, `toContainText`, `toHaveAttribute`, `toBeTruthy`, `toEqual`, and similar.
- Use screenshot helpers from `@utils` when the expected result is visual: `takeElementScreenshot`, `takeEditorScreenshot`, `takeTopToolbarScreenshot`, `takePageScreenshot`, and related helpers.
- Prefer state assertions over screenshots when the behavior can be checked reliably through DOM state, attributes, text, or API output.
- When using screenshots in macro mode, existing helpers already handle common details like padding, masking, hidden preview popups, and hidden scrollbars.

### Naming and comment block
- Each `test()` title must be a plain English sentence that starts with the serial number from the checklist item, for example `Case 1 - ...` or `1. ...`, matching the local style of the target file.
- Every generated autotest must include a comment block above the test body with:
  - AUTOTEST_REQUEST_URL - link to the Autotest Request issue
  - description
  - scenario steps
  - milestone version
    - Example:
```ts
import { Page, test, expect } from '@fixtures';
import { CommonTopRightToolbar } from '@tests/pages/common/CommonTopRightToolbar';
import { ContextMenu } from '@tests/pages/common/ContextMenu';
import { MonomerOption } from '@tests/pages/constants/contextMenu/Constants';
import { drawBenzeneRing } from '@tests/pages/molecules/BottomToolbar';
import { getAtomLocator } from '@utils/canvas/atoms/getAtomLocator/getAtomLocator';
import { selectAllStructuresOnCanvas } from '@utils';

let page: Page;

test.describe('Autotests: generated example', () => {
  test.beforeAll(async ({ initMoleculesCanvas }) => {
    page = await initMoleculesCanvas();
  });

  test.afterAll(async ({ closePage }) => {
    await closePage();
  });

  test('Case 1 - Copy action stays enabled for selected microstructure after switching to Macro mode', async () => {
    /*
     * Test task: https://github.com/epam/ketcher/issues/9999
     * Description: Copy action stays enabled for selected microstructure after switching to Macro mode
     * Scenario:
     * 1. Draw a benzene ring in Molecules mode
     * 2. Switch to Macro mode
     * 3. Select the structure on the canvas
     * 4. Verify that Copy is enabled in the context menu
     *
     * Version 3.12.0
     */
    await drawBenzeneRing(page);
    await CommonTopRightToolbar(page).turnOnMacromoleculesEditor();
    await selectAllStructuresOnCanvas(page);

    const targetAtom = getAtomLocator(page, { atomLabel: 'C' }).first();
    await expect(
      ContextMenu(page, targetAtom).isOptionEnabled(MonomerOption.Copy),
    ).resolves.toBeTruthy();
  });
});
```

### What to avoid
- Do not introduce new libraries.
- Do not duplicate selectors that already exist in page objects or utils.
- Do not hardcode sleeps when an existing wait helper or UI state check can be used.
- Do not create new helpers for one-off behavior unless the behavior is genuinely reusable across tests.
