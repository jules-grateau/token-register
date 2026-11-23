/* global process, console */
// Command line of the automation helpers (lib.mjs), for the auto-*.yml workflows (D-060).
// Usage:
//   node cli.mjs thread <issue.json> <comments.json> <owner> <bot>   issue + trusted comments (Markdown)
//   node cli.mjs round <comments.json> <bot>                         round of the last clarification
//   node cli.mjs clarification <round> <dev.md> [tech-lead.md] [designer.md]
//   node cli.mjs follow-up <status> <round>                          JSON {action, round?}
//   node cli.mjs work-branch <name>                                  true | false
//   node cli.mjs max-round                                           last clarification round allowed
//   node cli.mjs pr-marker <issue> <ui> <screens>
//   node cli.mjs neutral <file|->                                    agent text safe to publish
//   node cli.mjs field <file.json> <key>                             one field, raw ("" if absent)
// comments.json may come from `gh api --paginate --slurp` (an array of pages): it is flattened.
import fs from 'node:fs';
import {
  MAX_CLARIFICATION_ROUND,
  buildThread,
  clarificationComment,
  followUpAction,
  isWorkBranch,
  lastClarificationRound,
  neutralize,
  prMarker,
} from './lib.mjs';

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const readText = (file) => (file && fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '');
const comments = (file) => readJson(file).flat();

const [command, ...args] = process.argv.slice(2);
const commands = {
  thread: ([issue, list, owner, bot]) => buildThread(readJson(issue), comments(list), owner, bot),
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
