import dotenv from 'dotenv';
import logger from './utils/logger';
import { getConfiguredCurrency } from './utils/currency';
import { getConfiguredClientName } from './utils/runtimeConfig';
import {
  getTrustProxyHops,
  hasLegacyBasicAuth,
  LEGACY_BASIC_AUTH_WARNING,
} from './utils/authConfig';
import { openDb } from './db';
import { verifyInstanceCurrency } from './db/currency';
import { ensureInitialAdmin } from './db/accounts';
import { AuthService } from './services/auth.service';
import { createApp } from './app';

dotenv.config();
// D-008: instance currency, fixed by configuration. Throws on an invalid value.
const CURRENCY = getConfiguredCurrency();
// D-040: client (association) name shown in the header, fixed by configuration.
const CLIENT_NAME = getConfiguredClientName();
// D-063, answer 12 a: throws on an invalid value, before anything is served.
getTrustProxyHops();

const authService = new AuthService();
const app = createApp({ currency: CURRENCY, clientName: CLIENT_NAME, authService });

async function start(): Promise<void> {
  // D-009: never serve amounts if the configured currency differs from the database one.
  const db = await openDb();
  try {
    await verifyInstanceCurrency(db, CURRENCY);
    // D-063: no account yet -> the first admin from INITIAL_ADMIN_*, or the start is refused.
    // In a container the migration has done it already (entrypoint); here for `npm start`.
    const admin = await ensureInitialAdmin(db);
    if (admin.created) logger.info('First admin account created');
  } finally {
    await db.close();
  }
  const purged = await authService.purgeExpiredSessions();
  if (purged > 0) logger.info(`Expired sessions deleted: ${purged}`);

  app.listen(process.env.PORT, () => {
    logger.info(`Server is running on port ${process.env.PORT}`);
    logger.info(`Instance currency: ${CURRENCY}`);
    logger.info(`Frontend URL: ${process.env.FRONTEND_URL}`);
    if (hasLegacyBasicAuth()) {
      // console as well: in production the logger writes to a file, not to `docker logs`.
      console.warn(LEGACY_BASIC_AUTH_WARNING);
      logger.warn(LEGACY_BASIC_AUTH_WARNING);
    }
  });
}

start().catch((error: unknown) => {
  // console as well: the pino transport may not flush before process.exit.
  console.error('Server startup aborted:', error instanceof Error ? error.message : error);
  logger.fatal(error, 'Server startup aborted');
  process.exit(1);
});
