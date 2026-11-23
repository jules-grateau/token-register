/* global process, console */
// Publishes what the developer agent wrote for the review (auto-pr.yml, developer-next), once
// its commits are pushed: a reply in each line comment thread, then the recap on the PR. The
// agent's job has no write token: it only returns this text (D-060).
// Usage: node publish-answers.mjs <developer output.json>   Env: GH_TOKEN, REPO, PR.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { publishAnswers, reviewAnswers } from './lib.mjs';

const answers = reviewAnswers(JSON.parse(fs.readFileSync(process.argv[2], 'utf8')));
const gh = (args, input) =>
  execFileSync('gh', args, { input, stdio: ['pipe', 'ignore', 'inherit'] });
const published = publishAnswers(answers, { repo: process.env.REPO, pr: process.env.PR }, gh);
if (published < answers.replies.length) {
  console.log(`::warning::${answers.replies.length - published} réponse(s) de fil non publiée(s).`);
}
console.log(
  `${published} réponse(s) publiée(s), récapitulatif ${answers.recap ? 'publié' : 'absent'}.`
);
