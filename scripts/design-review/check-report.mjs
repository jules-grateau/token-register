/* global process, console */
// Free release smoke check (no AI): reads the report.json written by capture.mjs and
// fails if any step errored, the page logged a console/JS error, a screen overflowed
// horizontally, or a pop-up (modal, menu, list of options) stuck out of the window.
// The visual design review itself happens once, on the feature PR (D-038).
//
// Usage: node check-report.mjs <path/to/report.json>
// Writes a Markdown summary to $GITHUB_STEP_SUMMARY when available. On problems, also
// writes them to smoke-problems.md (current directory), which design-review.yml posts in
// its failure comment on the PR, and exits 1.
import fs from 'node:fs';

// Console errors that are known to be benign and must not fail the check.
// Only a console message's text is in report.json (no URL), so a pattern must be precise
// enough not to hide a real error: a generic "Failed to load resource: ... 404" would also
// hide a failing API call. Add an entry only for a false positive actually seen in a run,
// with the reason and where it was seen. Ignored errors are still counted in the summary.
// Format: { pattern: /regex on the message text/, reason: 'why it is benign (run / PR)' }
const IGNORED_CONSOLE_ERRORS = [];

// Text from the demo (error messages) goes into a PR comment: one line per problem, so the
// failure comment can count them (multi-line stacks are flattened), and inline code, so
// no @mention, link or Markdown in it is rendered. Backticks inside become quotes.
const asCode = (text) => '`' + String(text).replace(/\s+/g, ' ').trim().replace(/`/g, "'") + '`';

const isIgnoredConsoleError = (message) =>
  IGNORED_CONSOLE_ERRORS.some(({ pattern }) => pattern.test(message));

const file = process.argv[2];
if (!file || !fs.existsSync(file)) {
  console.error(`report.json not found: ${file ?? '(no path given)'}`);
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(file, 'utf8'));
const problems = [];
let stepsChecked = 0;
let ignoredConsoleErrors = 0;

for (const [viewport, vp] of Object.entries(report.viewports ?? {})) {
  for (const s of vp.steps ?? []) {
    stepsChecked += 1;
    if (s.error) problems.push(`${viewport} · ${s.step}: step failed (${asCode(s.error)})`);
    if (s.overflowX) problems.push(`${viewport} · ${s.step}: horizontal overflow`);
    for (const p of s.popupOverflow ?? [])
      problems.push(`${viewport} · ${s.step}: pop-up out of the window (${p})`);
  }
  for (const e of vp.consoleErrors ?? []) {
    if (isIgnoredConsoleError(e)) ignoredConsoleErrors += 1;
    else problems.push(`${viewport}: console error: ${asCode(e)}`);
  }
  for (const e of vp.pageErrors ?? []) problems.push(`${viewport}: JS error: ${asCode(e)}`);
}
if (report.cleanup?.failed?.length) {
  problems.push(`cleanup: test orders not deleted: ${report.cleanup.failed.join(', ')}`);
}

const summary = [
  `### Release smoke check: ${problems.length ? '❌' : '✅'}`,
  `${stepsChecked} steps checked on ${Object.keys(report.viewports ?? {}).join(', ')}.`,
  ...(ignoredConsoleErrors
    ? [`${ignoredConsoleErrors} known benign console error(s) ignored (IGNORED_CONSOLE_ERRORS).`]
    : []),
  ...(problems.length ? ['', ...problems.map((p) => `- ${p}`)] : []),
].join('\n');

console.log(summary);
if (process.env.GITHUB_STEP_SUMMARY)
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary + '\n');
if (problems.length) {
  fs.writeFileSync('smoke-problems.md', problems.map((p) => `- ${p}`).join('\n') + '\n');
  process.exit(1);
}
