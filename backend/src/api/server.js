// ESM shim so tests can import server.js while source lives in server.ts
import app, { runtime } from './server.ts';
export default app;
export { runtime };// Shim for tests importing server.js while source lives in server.ts (ESM NodeNext)
import app, { runtime } from './server.ts';
export default app;
export { runtime };