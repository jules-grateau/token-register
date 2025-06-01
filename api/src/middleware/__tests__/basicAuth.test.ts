import type { Request, Response } from 'express';
import { basicAuthMiddleware } from '../basicAuth';

describe('basicAuthMiddleware', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, BASIC_AUTH_USER: 'user', BASIC_AUTH_PASS: 'pass' };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  function createResMock(): Partial<Response> {
    return {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      setHeader: jest.fn(),
    };
  }

  it('calls next() for valid credentials', () => {
    const req: Partial<Request> = {
      headers: {
        authorization: `Basic ${Buffer.from('user:pass').toString('base64')}`,
      },
    };
    const res = createResMock();
    const next = jest.fn();

    basicAuthMiddleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('rejects if no auth header', () => {
    const req: Partial<Request> = { headers: {} };
    const res = createResMock();
    const next = jest.fn();

    basicAuthMiddleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith('Authentication required.');
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects if wrong credentials', () => {
    const req: Partial<Request> = {
      headers: {
        authorization: `Basic ${Buffer.from('user:wrong').toString('base64')}`,
      },
    };
    const res = createResMock();
    const next = jest.fn();

    basicAuthMiddleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith('Invalid credentials.');
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects if env vars missing', () => {
    process.env.BASIC_AUTH_USER = '';
    process.env.BASIC_AUTH_PASS = '';
    const req: Partial<Request> = { headers: {} };
    const res = createResMock();
    const next = jest.fn();

    basicAuthMiddleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith('Server configuration error.');
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects if credentials are malformed', () => {
    const req: Partial<Request> = {
      headers: {
        authorization: 'Basic not-base64',
      },
    };
    const res = createResMock();
    const next = jest.fn();

    basicAuthMiddleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith('Invalid credential format after decoding.');
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects if header authorization is not basic', () => {
    const req: Partial<Request> = {
      headers: {
        authorization: 'NotBasic user:pass',
      },
    };
    const res = createResMock();
    const next = jest.fn();

    basicAuthMiddleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith(
      'Invalid authentication type or format. Basic authentication required.'
    );
    expect(next).not.toHaveBeenCalled();
  });
});
