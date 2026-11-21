import logger from '../../../utils/logger';
import {
  createTempDbPath,
  hasAppTables,
  listTables,
  waitFor,
  wasLogged,
  APP_TABLES,
  INIT_DONE_MESSAGES,
} from './dbTestUtils';

// Above the 10 s of waitFor, so that its explicit message is the one reported (TL-1).
jest.setTimeout(15000);

const { dbPath: tempDbPath, cleanup } = createTempDbPath('test-db-flush');
let infoSpy: jest.SpyInstance;

beforeAll(() => {
  infoSpy = jest.spyOn(logger, 'info');
  process.env.DATABASE_PATH = tempDbPath;
});

afterAll(() => {
  infoSpy.mockRestore();
  cleanup();
});

it('should remove all tables', async () => {
  await import('../initDb');
  await waitFor(() => hasAppTables(tempDbPath), 'initDb to create the tables');
  await waitFor(() => wasLogged(infoSpy, INIT_DONE_MESSAGES), 'initDb to finish');
  await import('../flushDb');
  await waitFor(() => wasLogged(infoSpy, ['All tables dropped']), 'flushDb to drop the tables');

  const tables = await listTables(tempDbPath);
  expect(tables.filter((table) => APP_TABLES.includes(table))).toEqual([]);
});
