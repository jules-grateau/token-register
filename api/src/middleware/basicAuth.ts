// backend/src/middleware/basicAuth.ts
import { Request, Response, NextFunction } from 'express';

export function basicAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const user = process.env.BASIC_AUTH_USER;
  const pass = process.env.BASIC_AUTH_PASS;

  if (!user || !pass) {
    console.error('Basic Auth credentials not configured in environment variables.');
    res.status(500).send('Server configuration error.');
    return;
  }

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Restricted Area"');
    res.status(401).send('Authentication required.');
    return;
  }

  const parts = authHeader.split(' '); // Use a different variable name

  if (parts.length !== 2 || parts[0] !== 'Basic') {
    res.setHeader('WWW-Authenticate', 'Basic realm="Restricted Area"');
    res.status(401).send('Invalid authentication type or format. Basic authentication required.');
    return;
  }

  const credentialsB64 = parts[1];

  try {
    const decodedCredentials = Buffer.from(credentialsB64, 'base64').toString();
    const [username, password] = decodedCredentials.split(':');

    if (typeof username === 'undefined' || typeof password === 'undefined') {
        res.setHeader('WWW-Authenticate', 'Basic realm="Restricted Area"');
        res.status(401).send('Invalid credential format after decoding.');
        return;
    }

    if (username === user && password === pass) {
      next();
      return;
    } else {
      res.setHeader('WWW-Authenticate', 'Basic realm="Restricted Area"');
      res.status(401).send('Invalid credentials.');
      return; 
    }
  } catch (error) {
    console.error("Error decoding Basic Auth credentials:", error);
    res.setHeader('WWW-Authenticate', 'Basic realm="Restricted Area"');
    res.status(401).send('Invalid authentication format (error during decoding).');
    return; // 
  }
}