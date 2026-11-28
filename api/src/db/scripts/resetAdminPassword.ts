import { openDb } from '../index';
import { resetAdminPassword, RESET_ADMIN_COMMAND } from '../accounts';

/**
 * Admin command (D-063, answer 4 a): gives back access when the admin password is lost.
 *   RESET_ADMIN_PASSWORD=<new password> npm run prod:db:reset-admin-password -- <username>
 * The password is read from the environment, never from the command line (shell history,
 * process list), and is never printed. See deploy/README.md, "User accounts".
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.length !== 1 || args[0].startsWith('-')) {
    throw new Error(`Usage: ${RESET_ADMIN_COMMAND}`);
  }
  const db = await openDb();
  try {
    const { action, closedSessions } = await resetAdminPassword(
      db,
      args[0],
      process.env.RESET_ADMIN_PASSWORD
    );
    console.log(
      action === 'created'
        ? 'Done: a new admin account was created with this password.'
        : `Done: new password set, account active and admin; ${closedSessions} session(s) closed.`
    );
  } finally {
    await db.close();
  }
}

main().catch((error: unknown) => {
  console.error(
    `reset-admin-password failed: ${error instanceof Error ? error.message : String(error)}`
  );
  process.exit(1);
});
