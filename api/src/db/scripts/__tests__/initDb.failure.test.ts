import fs from 'fs';
import logger from '../../../utils/logger';
import { createTempDbPath, waitFor, wasLogged, INIT_DONE_MESSAGES } from './dbTestUtils';

// Above the 10 s of waitFor, so that its explicit message is the one reported (TL-1).
jest.setTimeout(15000);

const { dbPath: tempDbPath, cleanup } = createTempDbPath('test-db-init-failure');
let infoSpy: jest.SpyInstance;
let errorSpy: jest.SpyInstance;
const previousExitCode = process.exitCode;

beforeAll(() => {
  infoSpy = jest.spyOn(logger, 'info');
  errorSpy = jest.spyOn(logger, 'error');
  process.env.DATABASE_PATH = tempDbPath;
  // Not an SQLite file: opening works, creating the tables fails.
  fs.writeFileSync(tempDbPath, 'this is not a database, just some text long enough');
});

afterAll(() => {
  infoSpy.mockRestore();
  errorSpy.mockRestore();
  process.exitCode = previousExitCode;
  cleanup();
});

it('stops the start when the tables cannot be created (D-055)', async () => {
  await import('../initDb');
  await waitFor(
    () => wasLogged(errorSpy, ['Error initializing database']),
    'initDb to report the failure'
  );

  expect(process.exitCode).toBe(1);
  expect(wasLogged(infoSpy, INIT_DONE_MESSAGES)).toBe(false);
});
