/* global process, console */
// Command line of the automation helpers (lib.mjs), for the auto-*.yml workflows (D-060).
// Usage:
//   node cli.mjs thread <issue.json> <comments.json> <owner> <bot>   issue + trusted comments (Markdown)
//   node cli.mjs review-thread <comments.json> <line-comments.json> <owner> <bot>
//   node cli.mjs round <comments.json> <bot>                         round of the last clarification
//   node cli.mjs clarification <round> <dev.md> [tech-lead.md] [designer.md]
//   node cli.mjs follow-up <status> <round>                          JSON {action, round?}
//   node cli.mjs work-branch <name>                                  true | false
//   node cli.mjs max-round                                           last clarification round allowed
//   node cli.mjs pr-marker <issue> <ui> <screens>
//   node cli.mjs neutral <file|->                                    agent text safe to publish
//   node cli.mjs read-pr-marker <body.md>                            marker as JSON, "" if none
//   node cli.mjs max-review-round                                    last review round allowed
//   node cli.mjs design-state <comments.json> <bot> <ui>              none | pending | ok | ko
//   node cli.mjs next-step       (env ROUND, TL_RESULT, TL_OUT, DS_RESULT, DS_OUT, DESIGN) -> JSON
//   node cli.mjs merged-prs <subjects.txt>                           PR numbers, one per line
//   node cli.mjs release-pr <prs.json> <version> <main version> <bumped> -> JSON {title, body}
//   node cli.mjs field <file.json> <key>                             one field, raw ("" if absent)
// comments.json may come from `gh api --paginate --slurp` (an array of pages): it is flattened.
import fs from 'node:fs';
import {
  MAX_CLARIFICATION_ROUND,
  MAX_REVIEW_ROUND,
  buildReviewThread,
  buildThread,
  clarificationComment,
  designState,
  followUpAction,
  isWorkBranch,
  lastClarificationRound,
  neutralize,
  mergedPrNumbers,
  nextStep,
  parsePrMarker,
  prMarker,
  releasePr,
} from './lib.mjs';

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const readText = (file) => (file && fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '');
const comments = (file) => readJson(file).flat();

// A structured output of claude-code-action, empty when the step did not run.
const parseOutput = (text) => {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
};

const [command, ...args] = process.argv.slice(2);
const commands = {
  thread: ([issue, list, owner, bot]) => buildThread(readJson(issue), comments(list), owner, bot),
  'review-thread': ([list, lines, owner, bot]) =>
    buildReviewThread(comments(list), comments(lines), owner, bot),
  round: ([list, bot]) => String(lastClarificationRound(comments(list), bot)),
  clarification: ([round, dev, techLead, designer]) =>
    clarificationComment({
      round: Number(round),
      dev: readText(dev),
      techLead: readText(techLead),
      designer: readText(designer),
    }),
  'follow-up': ([status, round]) => JSON.stringify(followUpAction(status, Number(round))),
  'work-branch': ([name]) => String(isWorkBranch(name)),
  'max-round': () => String(MAX_CLARIFICATION_ROUND),
  'pr-marker': ([issue, ui, screens]) => prMarker({ issue, ui, screens }),
  neutral: ([file]) => neutralize(fs.readFileSync(!file || file === '-' ? 0 : file, 'utf8')),
  'read-pr-marker': ([body]) => {
    const marker = parsePrMarker(readText(body));
    return marker ? JSON.stringify(marker) : '';
  },
  'max-review-round': () => String(MAX_REVIEW_ROUND),
  'design-state': ([list, bot, ui]) => designState(comments(list), bot, ui === 'true'),
  'next-step': () => {
    const env = process.env;
    return JSON.stringify(
      nextStep({
        round: Number(env.ROUND),
        techLead: { result: env.TL_RESULT, output: parseOutput(env.TL_OUT) },
        designer: { result: env.DS_RESULT, output: parseOutput(env.DS_OUT) },
        designBefore: env.DESIGN,
      })
    );
  },
  'merged-prs': ([file]) => mergedPrNumbers(readText(file).split(/\r?\n/)).join('\n'),
  'release-pr': ([prs, version, mainVersion, bumped]) =>
    JSON.stringify(
      releasePr({ version, mainVersion, bumped: bumped === 'true', prs: readJson(prs) })
    ),
  field: ([file, key]) => {
    const value = readJson(file)?.[key];
    if (value === undefined || value === null) return '';
    return typeof value === 'string' ? value : JSON.stringify(value);
  },
};

if (!commands[command]) {
  console.error(`Unknown command: ${command ?? '(none)'}. See the header of cli.mjs.`);
  process.exit(2);
}
process.stdout.write(commands[command](args) + '\n');
