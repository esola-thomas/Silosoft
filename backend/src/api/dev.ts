// Dev entrypoint: mounts routes (via index) and starts server.
import './index.ts';
import { app } from './index.ts';
import { initWebSocket } from './websocket.ts';
import { createServer } from 'http';

const port = process.env.PORT ? Number(process.env.PORT) : 3000;
const server = createServer(app);
initWebSocket(server);
server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Silosoft backend (HTTP+WS) listening on http://localhost:${port}`);
});
