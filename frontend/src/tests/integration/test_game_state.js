import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';
import { GameProvider } from '../../context/GameContext';
import apiService from '../../services/ApiService';

describe('Frontend Game State Management Integration Tests', () => {
  let mocks;

  beforeEach(() => {
    mocks = {
      createGame: jest.spyOn(apiService, 'createGame'),
      getGameState: jest.spyOn(apiService, 'getGameState'),
      drawCard: jest.spyOn(apiService, 'drawCard'),
      assignResource: jest.spyOn(apiService, 'assignResource'),
      endTurn: jest.spyOn(apiService, 'endTurn'),
      joinGame: jest.spyOn(apiService, 'joinGame'),
      setPlayerReady: jest.spyOn(apiService, 'setPlayerReady'),
      startGame: jest.spyOn(apiService, 'startGame'),
    };

    window.localStorage?.clear?.();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const buildLobbyGame = (overrides = {}) => ({
    id: 'game-123',
    players: [
      {
        id: 'p1',
        name: 'Alice',
        hand: [],
        score: 0,
        temporarilyUnavailable: [],
        joinCode: 'ALICE1',
        isConnected: false,
        isReady: false,
      },
      {
        id: 'p2',
        name: 'Bob',
        hand: [],
        score: 0,
        temporarilyUnavailable: [],
        joinCode: 'BOB2',
        isConnected: false,
        isReady: false,
      },
    ],
    currentRound: 1,
    currentPlayerIndex: 0,
    currentPlayerId: 'p1',
    gamePhase: 'lobby',
    featuresInPlay: [],
    deck: [],
    deckSize: 0,
    maxRounds: 10,
    winCondition: false,
    isGameOver: false,
    lastAction: null,
    createdAt: '2024-01-01T00:00:00Z',
    ...overrides,
  });

  const buildPlayingGame = (overrides = {}) => ({
    ...buildLobbyGame(),
    gamePhase: 'playing',
    currentPlayerIndex: 0,
    currentPlayerId: 'p1',
    players: [
      {
        id: 'p1',
        name: 'Alice',
        hand: [],
        score: 0,
        temporarilyUnavailable: [],
        joinCode: 'ALICE1',
        isConnected: true,
        isReady: true,
      },
      {
        id: 'p2',
        name: 'Bob',
        hand: [],
        score: 0,
        temporarilyUnavailable: [],
        joinCode: 'BOB2',
        isConnected: true,
        isReady: true,
      },
    ],
    ...overrides,
  });

  const joinSeatAndStart = async ({ joinResponse, readyResponse }) => {
    if (joinResponse) {
      mocks.joinGame.mockResolvedValueOnce(joinResponse);
    }

    const joinButton = await screen.findByRole('button', { name: /Join as Alice/i });
    await userEvent.click(joinButton);

    await waitFor(() => {
      expect(mocks.joinGame).toHaveBeenCalled();
    });

    if (readyResponse) {
      mocks.setPlayerReady.mockResolvedValueOnce(readyResponse);

      const readyButton = await screen.findByRole('button', { name: /Set Ready/i });
      await userEvent.click(readyButton);

      await waitFor(() => {
        expect(mocks.setPlayerReady).toHaveBeenCalled();
      });
    }
  };

  describe('Game initialization', () => {
    it('should create a new game with player names', async () => {
      const lobbyGame = buildLobbyGame({ id: 'game-123' });
      mocks.createGame.mockResolvedValue(lobbyGame);

      render(
        <GameProvider>
          <App />
        </GameProvider>
      );

      const player1Input = screen.getByPlaceholderText(/player 1/i);
      const player2Input = screen.getByPlaceholderText(/player 2/i);
      const startButton = screen.getByText(/start game/i);

      await userEvent.type(player1Input, 'Alice');
      await userEvent.type(player2Input, 'Bob');
      await userEvent.click(startButton);

      await waitFor(() => {
        expect(mocks.createGame).toHaveBeenCalledWith(['Alice', 'Bob']);
      });

      expect(screen.getByText(/game lobby/i)).toBeInTheDocument();
      expect(screen.getByText(/Join Code/i)).toBeInTheDocument();
    });

    it('should validate player count constraints', async () => {
      render(
        <GameProvider>
          <App />
        </GameProvider>
      );

      const startButton = screen.getByText(/start game/i);

      await userEvent.click(startButton);

      expect(screen.getByText(/Player 1 name is required/i)).toBeInTheDocument();
      expect(mocks.createGame).not.toHaveBeenCalled();
    });

    it('should display initial game state after creation', async () => {
      const lobbyGame = buildLobbyGame({ id: 'game-456' });

      const lobbyAfterJoin = {
        ...lobbyGame,
        players: [
          { ...lobbyGame.players[0], isConnected: true },
          lobbyGame.players[1],
        ],
      };

      const playingGame = buildPlayingGame({
        id: 'game-456',
        deck: Array(30).fill({ cardType: 'resource' }),
        deckSize: 30,
        players: [
          {
            ...lobbyGame.players[0],
            isConnected: true,
            isReady: true,
            hand: [
              { id: 'c1', cardType: 'resource', role: 'dev', level: 'senior', value: 3 },
              { id: 'c2', cardType: 'feature', name: 'Login', points: 3 },
            ],
          },
          {
            ...lobbyGame.players[1],
            isConnected: true,
            isReady: true,
            hand: [
              { id: 'c3', cardType: 'resource', role: 'pm', level: 'junior', value: 2 },
            ],
          },
        ],
        featuresInPlay: [
          {
            id: 'f1',
            name: 'Dashboard',
            requirements: { dev: 3, pm: 2, ux: 1 },
            points: 5,
            assignedResources: [],
            completed: false,
          },
        ],
      });

      mocks.createGame.mockResolvedValue(lobbyGame);

      render(
        <GameProvider>
          <App />
        </GameProvider>
      );

      const player1Input = screen.getByPlaceholderText(/player 1/i);
      const player2Input = screen.getByPlaceholderText(/player 2/i);
      const startButton = screen.getByText(/start game/i);

      await userEvent.type(player1Input, 'Alice');
      await userEvent.type(player2Input, 'Bob');
      await userEvent.click(startButton);

      await joinSeatAndStart({
        joinResponse: {
          playerId: 'p1',
          playerName: 'Alice',
          playerToken: 'token-p1',
          gameState: lobbyAfterJoin,
        },
        readyResponse: playingGame,
      });

      await waitFor(() => {
        expect(screen.getByText(/Round 1\/10/i)).toBeInTheDocument();
        expect(screen.getByText(/Current Turn/i)).toHaveTextContent('Alice');
        expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
        expect(screen.getByText(/30 cards left/i)).toBeInTheDocument();
      });
    });
  });

  describe('Turn actions', () => {
    it('should handle draw card action', async () => {
      const lobbyGame = buildLobbyGame({ id: 'game-789' });
      const lobbyAfterJoin = {
        ...lobbyGame,
        players: [
          { ...lobbyGame.players[0], isConnected: true },
          lobbyGame.players[1],
        ],
      };

      const playingGame = buildPlayingGame({
        id: 'game-789',
        deck: Array(40).fill({}),
        deckSize: 40,
        players: [
          {
            ...lobbyGame.players[0],
            isConnected: true,
            isReady: true,
            hand: [],
          },
          {
            ...lobbyGame.players[1],
            isConnected: true,
            isReady: true,
            hand: [],
          },
        ],
        featuresInPlay: [],
      });

      const drawnCard = {
        id: 'c10',
        cardType: 'resource',
        role: 'dev',
        level: 'senior',
        value: 3,
      };

      const postDrawState = {
        ...playingGame,
        deck: Array(39).fill({}),
        deckSize: 39,
        players: [
          {
            ...playingGame.players[0],
            hand: [drawnCard],
          },
          playingGame.players[1],
        ],
      };

      mocks.createGame.mockResolvedValue(lobbyGame);
      mocks.drawCard.mockResolvedValue({ card: drawnCard, gameState: postDrawState });

      render(
        <GameProvider>
          <App />
        </GameProvider>
      );

      const player1Input = screen.getByPlaceholderText(/player 1/i);
      const player2Input = screen.getByPlaceholderText(/player 2/i);
      await userEvent.type(player1Input, 'Alice');
      await userEvent.type(player2Input, 'Bob');
      await userEvent.click(screen.getByText(/start game/i));

      await joinSeatAndStart({
        joinResponse: {
          playerId: 'p1',
          playerName: 'Alice',
          playerToken: 'token-p1',
          gameState: lobbyAfterJoin,
        },
        readyResponse: playingGame,
      });

      const drawButton = screen.getByText(/draw card/i);
      await userEvent.click(drawButton);

      await waitFor(() => {
        expect(mocks.drawCard).toHaveBeenCalledWith('game-789', 'p1', 'token-p1');
        expect(screen.getByText(/dev - senior/i)).toBeInTheDocument();
        expect(screen.getByText(/39 cards left/i)).toBeInTheDocument();
      });
    });

    it('should handle resource assignment with drag and drop', async () => {
      const game = {
        id: 'game-101',
        players: [
          {
            id: 'p1',
            name: 'Alice',
            hand: [
              { id: 'r1', cardType: 'resource', role: 'dev', level: 'senior', value: 3 },
            ],
            score: 0,
          },
        ],
        currentRound: 1,
        currentPlayerIndex: 0,
        gamePhase: 'playing',
        featuresInPlay: [
          {
            id: 'f1',
            name: 'Login',
            requirements: { dev: 3, pm: 0, ux: 0 },
            points: 3,
            assignedResources: [],
            completed: false,
          },
        ],
        deck: [],
      };

      const updatedGame = {
        ...game,
        players: [
          { ...game.players[0], hand: [] },
        ],
        featuresInPlay: [
          {
            ...game.featuresInPlay[0],
            assignedResources: [game.players[0].hand[0]],
            completed: true,
          },
        ],
      };

      mockApiService.createGame.mockResolvedValue(game);
      mockApiService.assignResource.mockResolvedValue({
        featureCompleted: true,
        pointsAwarded: 3,
        gameState: updatedGame,
      });

      render(
        <GameProvider>
          <App />
        </GameProvider>
      );

      const player1Input = screen.getByPlaceholderText(/player 1/i);
      await userEvent.type(player1Input, 'Alice');
      await userEvent.click(screen.getByText(/start game/i));

      await waitFor(() => {
        expect(screen.getByText(/senior developer/i)).toBeInTheDocument();
        expect(screen.getByText(/login/i)).toBeInTheDocument();
      });

      const resourceCard = screen.getByTestId('resource-r1');
      const featureCard = screen.getByTestId('feature-f1');

      fireEvent.dragStart(resourceCard);
      fireEvent.dragOver(featureCard);
      fireEvent.drop(featureCard);

      await waitFor(() => {
        expect(mockApiService.assignResource).toHaveBeenCalledWith('game-101', 'p1', 'r1', 'f1');
        expect(screen.getByText(/feature completed/i)).toBeInTheDocument();
        expect(screen.getByText(/3 points awarded/i)).toBeInTheDocument();
      });
    });

    it('should handle end turn action', async () => {
      const game = {
        id: 'game-202',
        players: [
          { id: 'p1', name: 'Alice', hand: [], score: 0 },
          { id: 'p2', name: 'Bob', hand: [], score: 0 },
        ],
        currentRound: 1,
        currentPlayerIndex: 0,
        gamePhase: 'playing',
        featuresInPlay: [],
        deck: [],
      };

      const updatedGame = {
        ...game,
        currentPlayerIndex: 1,
      };

      mockApiService.createGame.mockResolvedValue(game);
      mockApiService.endTurn.mockResolvedValue(updatedGame);

      render(
        <GameProvider>
          <App />
        </GameProvider>
      );

      const player1Input = screen.getByPlaceholderText(/player 1/i);
      const player2Input = screen.getByPlaceholderText(/player 2/i);
      await userEvent.type(player1Input, 'Alice');
      await userEvent.type(player2Input, 'Bob');
      await userEvent.click(screen.getByText(/start game/i));

      await waitFor(() => {
        expect(screen.getByText(/alice's turn/i)).toBeInTheDocument();
      });

      const endTurnButton = screen.getByText(/end turn/i);
      await userEvent.click(endTurnButton);

      await waitFor(() => {
        expect(mockApiService.endTurn).toHaveBeenCalledWith('game-202', 'p1');
        expect(screen.getByText(/bob's turn/i)).toBeInTheDocument();
      });
    });
  });

  describe('Game state synchronization', () => {
    it('should poll for game state updates', async () => {
      const initialState = {
        id: 'game-303',
        players: [
          { id: 'p1', name: 'Alice', hand: [], score: 0 },
          { id: 'p2', name: 'Bob', hand: [], score: 0 },
        ],
        currentRound: 1,
        currentPlayerIndex: 0,
        gamePhase: 'playing',
        featuresInPlay: [],
        deck: [],
      };

      const updatedState = {
        ...initialState,
        currentPlayerIndex: 1,
        players: [
          { ...initialState.players[0], score: 5 },
          initialState.players[1],
        ],
      };

      mockApiService.createGame.mockResolvedValue(initialState);
      mockApiService.getGameState
        .mockResolvedValueOnce(initialState)
        .mockResolvedValueOnce(updatedState);

      jest.useFakeTimers();

      render(
        <GameProvider>
          <App />
        </GameProvider>
      );

      const player1Input = screen.getByPlaceholderText(/player 1/i);
      const player2Input = screen.getByPlaceholderText(/player 2/i);
      await userEvent.type(player1Input, 'Alice');
      await userEvent.type(player2Input, 'Bob');
      await userEvent.click(screen.getByText(/start game/i));

      await waitFor(() => {
        expect(screen.getByText(/alice's turn/i)).toBeInTheDocument();
      });

      jest.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(mockApiService.getGameState).toHaveBeenCalled();
        expect(screen.getByText(/bob's turn/i)).toBeInTheDocument();
        expect(screen.getByText(/alice: 5 points/i)).toBeInTheDocument();
      });

      jest.useRealTimers();
    });

    it('should handle network errors gracefully', async () => {
      mockApiService.createGame.mockRejectedValue(new Error('Network error'));

      render(
        <GameProvider>
          <App />
        </GameProvider>
      );

      const player1Input = screen.getByPlaceholderText(/player 1/i);
      const player2Input = screen.getByPlaceholderText(/player 2/i);
      await userEvent.type(player1Input, 'Alice');
      await userEvent.type(player2Input, 'Bob');
      await userEvent.click(screen.getByText(/start game/i));

      await waitFor(() => {
        expect(screen.getByText(/failed to create game/i)).toBeInTheDocument();
      });
    });

    it('should disable actions when not current player turn', async () => {
      const game = {
        id: 'game-404',
        players: [
          { id: 'p1', name: 'Alice', hand: [], score: 0 },
          { id: 'p2', name: 'Bob', hand: [], score: 0 },
        ],
        currentRound: 1,
        currentPlayerIndex: 1,
        gamePhase: 'playing',
        featuresInPlay: [],
        deck: [],
      };

      mockApiService.createGame.mockResolvedValue(game);

      render(
        <GameProvider>
          <App />
        </GameProvider>
      );

      const player1Input = screen.getByPlaceholderText(/player 1/i);
      const player2Input = screen.getByPlaceholderText(/player 2/i);
      await userEvent.type(player1Input, 'Alice');
      await userEvent.type(player2Input, 'Bob');
      await userEvent.click(screen.getByText(/start game/i));

      await waitFor(() => {
        expect(screen.getByText(/bob's turn/i)).toBeInTheDocument();
        const drawButton = screen.getByText(/draw card/i);
        expect(drawButton).toBeDisabled();
      });
    });
  });

  describe('Event handling', () => {
    it('should display event card effects', async () => {
      const game = {
        id: 'game-505',
        players: [
          {
            id: 'p1',
            name: 'Alice',
            hand: [
              { id: 'r1', cardType: 'resource', role: 'dev', level: 'senior', value: 3 },
              { id: 'r2', cardType: 'resource', role: 'pm', level: 'junior', value: 2 },
            ],
            score: 0,
          },
        ],
        currentRound: 1,
        currentPlayerIndex: 0,
        gamePhase: 'playing',
        featuresInPlay: [],
        deck: [],
      };

      const eventCard = {
        id: 'e1',
        cardType: 'event',
        type: 'layoff',
        name: 'Budget Cuts',
        effect: 'Discard 2 resource cards',
      };

      const updatedGame = {
        ...game,
        players: [
          {
            ...game.players[0],
            hand: [],
          },
        ],
      };

      mockApiService.createGame.mockResolvedValue(game);
      mockApiService.drawCard.mockResolvedValue({ card: eventCard, gameState: updatedGame });

      render(
        <GameProvider>
          <App />
        </GameProvider>
      );

      const player1Input = screen.getByPlaceholderText(/player 1/i);
      await userEvent.type(player1Input, 'Alice');
      await userEvent.click(screen.getByText(/start game/i));

      await waitFor(() => {
        expect(screen.getByText(/alice's turn/i)).toBeInTheDocument();
      });

      const drawButton = screen.getByText(/draw card/i);
      await userEvent.click(drawButton);

      await waitFor(() => {
        expect(screen.getByText(/budget cuts/i)).toBeInTheDocument();
        expect(screen.getByText(/discard 2 resource cards/i)).toBeInTheDocument();
        expect(screen.queryByText(/senior developer/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Win/Loss conditions', () => {
    it('should display win message when all features completed', async () => {
      const game = {
        id: 'game-606',
        players: [
          { id: 'p1', name: 'Alice', hand: [], score: 15 },
          { id: 'p2', name: 'Bob', hand: [], score: 12 },
        ],
        currentRound: 5,
        currentPlayerIndex: 0,
        gamePhase: 'ended',
        winCondition: true,
        featuresInPlay: [],
        deck: [],
        statistics: {
          featuresCompleted: 5,
          mvpPlayerId: 'p1',
          highScore: 15,
        },
      };

      mockApiService.createGame.mockResolvedValue(game);

      render(
        <GameProvider>
          <App />
        </GameProvider>
      );

      const player1Input = screen.getByPlaceholderText(/player 1/i);
      const player2Input = screen.getByPlaceholderText(/player 2/i);
      await userEvent.type(player1Input, 'Alice');
      await userEvent.type(player2Input, 'Bob');
      await userEvent.click(screen.getByText(/start game/i));

      await waitFor(() => {
        expect(screen.getByText(/victory/i)).toBeInTheDocument();
        expect(screen.getByText(/all features completed/i)).toBeInTheDocument();
        expect(screen.getByText(/mvp: alice/i)).toBeInTheDocument();
        expect(screen.getByText(/team score: 27/i)).toBeInTheDocument();
      });
    });

    it('should display loss message after 10 rounds', async () => {
      const game = {
        id: 'game-707',
        players: [
          { id: 'p1', name: 'Alice', hand: [], score: 8 },
          { id: 'p2', name: 'Bob', hand: [], score: 5 },
        ],
        currentRound: 10,
        currentPlayerIndex: 0,
        gamePhase: 'ended',
        winCondition: false,
        featuresInPlay: [
          {
            id: 'f1',
            name: 'Unfinished Feature',
            completed: false,
            requirements: { dev: 5, pm: 3, ux: 2 },
            points: 8,
            assignedResources: [],
          },
        ],
        deck: [],
        statistics: {
          featuresCompleted: 2,
          featuresIncomplete: 3,
        },
      };

      mockApiService.createGame.mockResolvedValue(game);

      render(
        <GameProvider>
          <App />
        </GameProvider>
      );

      const player1Input = screen.getByPlaceholderText(/player 1/i);
      const player2Input = screen.getByPlaceholderText(/player 2/i);
      await userEvent.type(player1Input, 'Alice');
      await userEvent.type(player2Input, 'Bob');
      await userEvent.click(screen.getByText(/start game/i));

      await waitFor(() => {
        expect(screen.getByText(/game over/i)).toBeInTheDocument();
        expect(screen.getByText(/10 rounds completed/i)).toBeInTheDocument();
        expect(screen.getByText(/3 features incomplete/i)).toBeInTheDocument();
      });
    });
  });
});
