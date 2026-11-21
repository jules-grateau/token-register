/* global process, console */
// Free release smoke check (no AI): reads the report.json written by capture.mjs and
// fails if any step errored, the page logged a console/JS error, a screen overflowed
// horizontally, or a pop-up (modal, menu, list of options) stuck out of the window. The visual design review itself happens once, on the feature PR (D-038).
//
// Usage: node check-report.mjs <path/to/report.json>
// Writes a Markdown summary to $GITHUB_STEP_SUMMARY when available; exit 1 on problems.
import fs from 'node:fs';

const file = process.argv[2];
if (!file || !fs.existsSync(file)) {
  console.error(`report.json not found: ${file ?? '(no path given)'}`);
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(file, 'utf8'));
const problems = [];
let stepsChecked = 0;

for (const [viewport, vp] of Object.entries(report.viewports ?? {})) {
  for (const s of vp.steps ?? []) {
    stepsChecked += 1;
    if (s.error) problems.push(`${viewport} · ${s.step}: step failed (${s.error})`);
    if (s.overflowX) problems.push(`${viewport} · ${s.step}: horizontal overflow`);
    for (const p of s.popupOverflow ?? [])
      problems.push(`${viewport} · ${s.step}: pop-up out of the window (${p})`);
  }
  for (const e of vp.consoleErrors ?? []) problems.push(`${viewport}: console error: ${e}`);
  for (const e of vp.pageErrors ?? []) problems.push(`${viewport}: JS error: ${e}`);
}
if (report.cleanup?.failed?.length) {
  problems.push(`cleanup: test orders not deleted: ${report.cleanup.failed.join(', ')}`);
}

const summary = [
  `### Release smoke check: ${problems.length ? '❌' : '✅'}`,
  `${stepsChecked} steps checked on ${Object.keys(report.viewports ?? {}).join(', ')}.`,
  ...(problems.length ? ['', ...problems.map((p) => `- ${p}`)] : []),
].join('\n');

console.log(summary);
if (process.env.GITHUB_STEP_SUMMARY)
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary + '\n');
if (problems.length) {
  fs.writeFileSync('smoke-problems.md', problems.map((p) => `- ${p}`).join('\n'));
  process.exit(1);
}
