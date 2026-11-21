import logger from '../../../utils/logger';
import {
  createTempDbPath,
  hasAppTables,
  listTables,
  waitFor,
  wasLogged,
  APP_TABLES,
  SEED_DECISION_MESSAGES,
} from './dbTestUtils';

const { dbPath: tempDbPath, cleanup } = createTempDbPath('test-db-init');

beforeAll(() => {
  process.env.DATABASE_PATH = tempDbPath;
});

afterAll(() => {
  cleanup();
});

it('should create all tables', async () => {
  const infoSpy = jest.spyOn(logger, 'info');
  await import('../initDb');
  await waitFor(() => hasAppTables(tempDbPath), 'initDb to create the tables');
  // Let the script finish before the temporary directory is removed.
  await waitFor(() => wasLogged(infoSpy, SEED_DECISION_MESSAGES), 'initDb to decide on seeding');

  expect(await listTables(tempDbPath)).toEqual(expect.arrayContaining(APP_TABLES));
});
