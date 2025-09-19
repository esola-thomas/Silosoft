// API index (T052) - mount all route modules onto the server app
import app from './server.ts';
import gameStart from './routes/game_start.ts';
import gameState from './routes/game_state.ts';
import draw from './routes/draw.ts';
import trade from './routes/trade.ts';
import complete from './routes/complete.ts';
import pass from './routes/pass.ts';
import logRoute from './routes/log.ts';
import seed from './routes/seed.ts';
import gameActive from './routes/game_active.ts';
import gameFull from './routes/game_full.ts';
import gameReset from './routes/game_reset.ts';
import eventAck from './routes/event_ack.ts';
import gameReplay from './routes/game_replay.ts';

// Mount order
app.use(gameStart);
app.use(gameState);
app.use(draw);
app.use(trade);
app.use(complete);
app.use(pass);
app.use(logRoute);
app.use(seed);
app.use(gameActive);
app.use(gameFull);
app.use(gameReset);
app.use(eventAck);
app.use(gameReplay);

export { app };

// Optional start function for manual run (not used by tests yet)
export function start(port = 3000) {
  return app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Silosoft API listening on ${port}`);
  });
}