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

const { dbPath: tempDbPath, cleanup } = createTempDbPath('test-db-flush');

beforeAll(() => {
  process.env.DATABASE_PATH = tempDbPath;
});

afterAll(() => {
  cleanup();
});

it('should remove all tables', async () => {
  const infoSpy = jest.spyOn(logger, 'info');
  await import('../initDb');
  await waitFor(() => hasAppTables(tempDbPath), 'initDb to create the tables');
  await waitFor(() => wasLogged(infoSpy, SEED_DECISION_MESSAGES), 'initDb to decide on seeding');
  await import('../flushDb');
  await waitFor(() => wasLogged(infoSpy, ['All tables dropped']), 'flushDb to drop the tables');

  const tables = await listTables(tempDbPath);
  expect(tables.filter((table) => APP_TABLES.includes(table))).toEqual([]);
});
