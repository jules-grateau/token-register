import path from 'path';
import * as dbModule from '../index';
import logger from '../../utils/logger';
import { open as openSqlite } from 'sqlite';
import { Database } from 'sqlite3';

jest.mock('sqlite', () => ({
  open: jest.fn(),
}));
jest.mock('../../utils/logger');

describe('getDatabasePath', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('returns resolved path if DATABASE_PATH is set', () => {
    process.env.DATABASE_PATH = './test.sqlite';
    const result = dbModule.getDatabasePath();
    expect(result).toBe(path.resolve('./test.sqlite'));
  });

  it('logs error and exits if DATABASE_PATH is not set', () => {
    process.env.DATABASE_PATH = '';
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });
    (logger.error as jest.Mock).mockClear();

    expect(() => dbModule.getDatabasePath()).toThrow('process.exit called');
    expect(logger.error).toHaveBeenCalledWith(
      'FATAL: DATABASE_PATH environment variable is not set.'
    );
    exitSpy.mockRestore();
  });
});

describe('openDb', () => {
  it('calls open with correct arguments', async () => {
    process.env.DATABASE_PATH = './test.sqlite';
    const mockDb = { some: 'db' };
    const openMock = openSqlite as jest.Mock;
    openMock.mockResolvedValue(mockDb);

    const db = await dbModule.openDb();
    expect(openMock).toHaveBeenCalledWith({
      filename: path.resolve('./test.sqlite'),
      driver: Database,
    });
    expect(db).toBe(mockDb);
  });
});
