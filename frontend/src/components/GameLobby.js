import React, { useMemo } from 'react';
import { useGame } from '../context/GameContext';
import './GameLobby.css';

const GameLobby = () => {
  const {
    gameId,
    players,
    loading,
    currentPlayerId,
    playerToken,
    joinGame,
    setPlayerReadyStatus,
    startGame,
    leaveGameSession,
  } = useGame();

  const allConnected = useMemo(() => (
    players.length > 0 && players.every((player) => player.isConnected)
  ), [players]);

  const allReady = useMemo(() => (
    players.length > 0 && players.every((player) => player.isReady)
  ), [players]);

  const canStart = Boolean(playerToken) && allConnected && allReady;

  const handleJoinSeat = async (player) => {
    if (!player.joinCode || loading) {
      return;
    }

    try {
      await joinGame({ joinCode: player.joinCode, includeJoinCodes: true });
    } catch (error) {
      // Error handled by context
    }
  };

  const handleToggleReady = async (player) => {
    if (player.id !== currentPlayerId || loading) {
      return;
    }

    try {
      await setPlayerReadyStatus(!player.isReady, { includeJoinCodes: true });
    } catch (error) {
      // Error handled by context
    }
  };

  const handleStartGame = async () => {
    if (!canStart || loading) {
      return;
    }

    try {
      await startGame({ includeJoinCodes: true });
    } catch (error) {
      // Error handled by context
    }
  };

  const handleLeaveSeat = () => {
    if (!playerToken || loading) {
      return;
    }

    leaveGameSession();
  };

  return (
    <div className="game-lobby">
      <header className="lobby-header">
        <h2>Game Lobby</h2>
        <div className="lobby-info">
          <span className="lobby-label">Game ID:</span>
          <code className="lobby-code">{gameId}</code>
        </div>
        <p className="lobby-subtitle">
          Share the game ID and join codes below so your teammates can connect. When everyone is ready, start the game!
        </p>
      </header>

      <div className="lobby-body">
        <section className="lobby-players">
          {players.map((player) => {
            const isCurrent = player.id === currentPlayerId;
            const isSeatAvailable = !player.isConnected;
            const showJoinButton = isSeatAvailable && Boolean(player.joinCode);

            return (
              <div key={player.id} className={`lobby-player-card ${player.isConnected ? 'connected' : 'pending'}`}>
                <div className="player-card-header">
                  <h3>{player.name}</h3>
                  {isCurrent && <span className="player-badge">You</span>}
                </div>

                <div className="player-status">
                  <span className={`status-indicator ${player.isConnected ? 'status-connected' : 'status-pending'}`}>
                    {player.isConnected ? 'Connected' : 'Waiting'}
                  </span>
                  <span className={`status-indicator ${player.isReady ? 'status-ready' : 'status-not-ready'}`}>
                    {player.isReady ? 'Ready' : 'Not Ready'}
                  </span>
                </div>

                {player.joinCode && (
                  <div className="join-code-row">
                    <span className="join-code-label">Join Code:</span>
                    <code className="join-code-value">{player.joinCode}</code>
                    <button
                      type="button"
                      className="join-code-copy"
                      onClick={() => navigator.clipboard?.writeText(player.joinCode)}
                      disabled={loading}
                    >
                      Copy
                    </button>
                  </div>
                )}

                <div className="player-actions">
                  {isCurrent ? (
                    <>
                      <button
                        type="button"
                        className={`btn-ready ${player.isReady ? 'ready' : ''}`}
                        onClick={() => handleToggleReady(player)}
                        disabled={loading}
                      >
                        {player.isReady ? 'Ready' : 'Set Ready'}
                      </button>
                      <button
                        type="button"
                        className="btn-leave-seat"
                        onClick={handleLeaveSeat}
                        disabled={loading}
                      >
                        Leave Seat
                      </button>
                    </>
                  ) : showJoinButton ? (
                    <button
                      type="button"
                      className="btn-join-seat"
                      onClick={() => handleJoinSeat(player)}
                      disabled={loading}
                    >
                      Join as {player.name}
                    </button>
                  ) : (
                    <span className="seat-status-note">
                      {player.isConnected ? 'Seat taken' : 'Waiting for player'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      </div>

      <footer className="lobby-footer">
        <div className="lobby-summary">
          <span>{players.filter((player) => player.isConnected).length} / {players.length} players connected</span>
          <span>{players.filter((player) => player.isReady).length} ready</span>
        </div>

        <div className="lobby-controls">
          <button
            type="button"
            className="btn-start-game"
            onClick={handleStartGame}
            disabled={!canStart || loading}
          >
            {loading ? 'Processing...' : 'Start Game'}
          </button>
        </div>
      </footer>
    </div>
  );
};

export default GameLobby;
