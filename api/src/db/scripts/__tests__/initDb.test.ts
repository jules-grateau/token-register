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

// Above the 10 s of waitFor, so that its explicit message is the one reported (TL-1).
jest.setTimeout(15000);

const { dbPath: tempDbPath, cleanup } = createTempDbPath('test-db-init');
let infoSpy: jest.SpyInstance;

beforeAll(() => {
  infoSpy = jest.spyOn(logger, 'info');
  process.env.DATABASE_PATH = tempDbPath;
});

afterAll(() => {
  infoSpy.mockRestore();
  cleanup();
});

it('should create all tables', async () => {
  await import('../initDb');
  await waitFor(() => hasAppTables(tempDbPath), 'initDb to create the tables');
  // Let the script finish before the temporary directory is removed.
  await waitFor(() => wasLogged(infoSpy, SEED_DECISION_MESSAGES), 'initDb to decide on seeding');

  expect(await listTables(tempDbPath)).toEqual(expect.arrayContaining(APP_TABLES));
});
