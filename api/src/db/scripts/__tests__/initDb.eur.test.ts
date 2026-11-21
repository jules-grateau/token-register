import logger from '../../../utils/logger';
import {
  countCatalog,
  createTempDbPath,
  hasAppTables,
  waitFor,
  wasLogged,
  INIT_DONE_MESSAGES,
} from './dbTestUtils';

// Above the 10 s of waitFor, so that its explicit message is the one reported (TL-1).
jest.setTimeout(15000);

const { dbPath: tempDbPath, cleanup } = createTempDbPath('test-db-eur');
let infoSpy: jest.SpyInstance;
const previousCurrency = process.env.CURRENCY;

beforeAll(() => {
  infoSpy = jest.spyOn(logger, 'info');
  process.env.DATABASE_PATH = tempDbPath;
  process.env.CURRENCY = 'EUR';
});

afterAll(() => {
  infoSpy.mockRestore();
  if (previousCurrency === undefined) delete process.env.CURRENCY;
  else process.env.CURRENCY = previousCurrency;
  cleanup();
});

it('starts a new EUR instance with an empty catalog (D-055)', async () => {
  await import('../initDb');
  await waitFor(() => wasLogged(infoSpy, INIT_DONE_MESSAGES), 'initDb to finish');
  expect(await hasAppTables(tempDbPath)).toBe(true);

  expect(await countCatalog(tempDbPath)).toEqual({ categories: 0, products: 0 });
});
