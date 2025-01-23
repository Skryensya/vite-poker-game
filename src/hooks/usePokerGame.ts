import { useState, useEffect, useCallback } from "react";
import { ChipStack, GameState, RoundStage } from "../types/poker.types";
import {
  STARTING_SMALL_BLIND_AMOUNT,
  STARTING_BIG_BLIND_AMOUNT,
  BOT_PLAYERS_COUNT,
} from "../utils/constants";
import {
  createDeck,
  shuffleDeck,
  deductFromStack,
  defaultChipStack,
  getStackTotal,
  addToStack,
  createPlayers,
} from "../utils/pokerUtils";

/**
 * Utility that returns how many players are still active (not folded).
 */
function countActivePlayers(players: GameState["players"]) {
  return players.filter((p) => !p.folded).length;
}

/**
 * We return a *new* GameState object with the roundStage advanced,
 * the board updated (burn & flop/turn/river), etc.
 * BUT we do NOT call setGameState() inside here. Instead, we produce
 * the updated state so we can merge it in a single setGameState call.
 */
function nextRoundStageFromState(state: GameState): GameState {
  const updatedDeck = [...state.deck];
  const updatedBurn = [...state.burnCards];
  const updatedBoard = { ...state.board };
  let updatedShowdown = state.showdown;
  let newStage = state.roundStage;

  switch (state.roundStage) {
    case RoundStage.PRE_FLOP: {
      // Burn 1, deal 3 → FLOP
      updatedBurn.push(updatedDeck.pop()!);
      updatedBoard.flop = [
        updatedDeck.pop()!,
        updatedDeck.pop()!,
        updatedDeck.pop()!,
      ];
      newStage = RoundStage.FLOP;
      break;
    }
    case RoundStage.FLOP: {
      // Burn 1, deal 1 → TURN
      updatedBurn.push(updatedDeck.pop()!);
      updatedBoard.turn = [updatedDeck.pop()!];
      newStage = RoundStage.TURN;
      break;
    }
    case RoundStage.TURN: {
      // Burn 1, deal 1 → RIVER
      updatedBurn.push(updatedDeck.pop()!);
      updatedBoard.river = [updatedDeck.pop()!];
      newStage = RoundStage.RIVER;
      break;
    }
    case RoundStage.RIVER: {
      // Showdown
      newStage = RoundStage.SHOWDOWN;
      updatedShowdown = true;
      break;
    }
    case RoundStage.SHOWDOWN:
    default:
      // Possibly the round is over. Typically you'd start a new round or
      // do scoring, etc. We'll just leave it at showdown.
      break;
  }

  return {
    ...state,
    deck: updatedDeck,
    burnCards: updatedBurn,
    board: updatedBoard,
    showdown: updatedShowdown,
    roundStage: newStage,
    // Reset the per-stage counter since we moved on:
    playersActedThisStage: 0,
  };
}

export const usePokerGame = () => {
  const [gameState, setGameState] = useState<GameState>({
    deck: [],
    players: [],
    board: { flop: [], turn: [], river: [] },
    burnCards: [],
    pot: defaultChipStack(0),
    showdown: false,
    dealerIndex: 0,
    smallBlindIndex: 1,
    bigBlindIndex: 2,
    currentPlayerId: 0,
    roundStage: RoundStage.PRE_FLOP,

    /** NEW property: how many players have completed their turn in this stage */
    playersActedThisStage: 0, // <--- Add this
  });

  // ==========================
  // 1. Start / Setup Functions
  // ==========================
  const initGame = useCallback(() => {
    // Create and shuffle the deck
    const deck = shuffleDeck(createDeck());
    // Create players
    const players = createPlayers(BOT_PLAYERS_COUNT);

    // Deal two cards to each
    players.forEach((player) => {
      player.hand = [deck.pop()!, deck.pop()!];
    });

    // Initialize the state
    setGameState({
      deck,
      players,
      board: { flop: [], turn: [], river: [] },
      burnCards: [],
      pot: defaultChipStack(0),
      showdown: false,
      dealerIndex: 0,
      smallBlindIndex: 1,
      bigBlindIndex: 2,
      currentPlayerId: 0,
      roundStage: RoundStage.PRE_FLOP,
      playersActedThisStage: 0,
    });

    // Post blinds immediately (small & big)
    setTimeout(() => {
      placeBlinds();
    }, 0);
  }, []);

  const placeBlinds = useCallback(() => {
    setGameState((prev) => {
      if (prev.players.length < 2) return prev;

      const smallBlindAmount = STARTING_SMALL_BLIND_AMOUNT;
      const bigBlindAmount = STARTING_BIG_BLIND_AMOUNT;

      const updatedPlayers = prev.players.map((p, idx) => {
        if (idx === prev.smallBlindIndex) {
          const bet = Math.min(smallBlindAmount, getStackTotal(p.chipStack));
          return {
            ...p,
            chipStack: deductFromStack(p.chipStack, bet),
            bet,
          };
        }
        if (idx === prev.bigBlindIndex) {
          const bet = Math.min(bigBlindAmount, getStackTotal(p.chipStack));
          return {
            ...p,
            chipStack: deductFromStack(p.chipStack, bet),
            bet,
          };
        }
        return p;
      });

      const totalBlinds =
        Math.min(
          smallBlindAmount,
          getStackTotal(updatedPlayers[prev.smallBlindIndex].chipStack)
        ) +
        Math.min(
          bigBlindAmount,
          getStackTotal(updatedPlayers[prev.bigBlindIndex].chipStack)
        );

      const potAfterBlinds = addToStack(prev.pot, totalBlinds);

      return {
        ...prev,
        players: updatedPlayers,
        pot: potAfterBlinds,
      };
    });
  }, []);

  // =====================
  // 2. Round Stage Logic
  // =====================

  /**
   * Called whenever a player acts. We:
   * 1. Increment `playersActedThisStage`.
   * 2. If `playersActedThisStage >= numberOfActivePlayers`, then move to the next stage.
   * 3. Otherwise, do nothing more about the stage – just pass turn to next player.
   */
  const handlePostActionStageCheck = useCallback(
    (draft: GameState): GameState => {
      // 1) Increment how many players have acted
      const playersActed = draft.playersActedThisStage + 1;
      let newState = { ...draft, playersActedThisStage: playersActed };

      const activePlayers = countActivePlayers(draft.players);
      // 2) If all active players have acted => nextRoundStage
      if (playersActed >= activePlayers)
        newState = nextRoundStageFromState(newState);

      return newState;
    },
    []
  );

  /**
   * Move turn to the next non-folded player
   */
  const goToNextPlayer = useCallback((draft: GameState) => {
    let nextId = draft.currentPlayerId;
    const totalPlayers = draft.players.length;

    // find the next player that hasn't folded
    do {
      nextId = (nextId + 1) % totalPlayers;
    } while (draft.players[nextId].folded);

    draft.currentPlayerId = nextId;
  }, []);

  // =====================
  // 3. Player Actions
  // =====================
  const fold = useCallback(() => {
    setGameState((prev) => {
      // 1) Fold this player
      const updatedPlayers = prev.players.map((p, i) =>
        i === prev.currentPlayerId ? { ...p, folded: true } : p
      );

      // 2) Incorporate that into the new state
      let newState: GameState = {
        ...prev,
        players: updatedPlayers,
      };

      // 3) Pass turn to next player (in the same "draft")
      goToNextPlayer(newState);

      // 4) Check if we need to advance roundStage
      newState = handlePostActionStageCheck(newState);

      console.log(`- Player ${prev.players[prev.currentPlayerId].name} folds`);
      return newState;
    });
  }, [goToNextPlayer, handlePostActionStageCheck]);

  const check = useCallback(() => {
    setGameState((prev) => {
      // CONSOLE LOG WHICH PLAYER (NAME) checks
      console.log(`- Player ${prev.players[prev.currentPlayerId].name} checks`);

      let newState = { ...prev };

      // Pass turn
      goToNextPlayer(newState);
      // Possibly next stage
      newState = handlePostActionStageCheck(newState);

      return newState;
    });
  }, [goToNextPlayer, handlePostActionStageCheck]);

  const call = useCallback(() => {
    setGameState((prev) => {
      console.log(`- Player ${prev.players[prev.currentPlayerId].name} calls`);

      // Deduct some mock call from the current player's stack
      const updatedPlayers = prev.players.map((p, i) => {
        if (i === prev.currentPlayerId) {
          const callAmount = 10; // (mock)
          const callBet = Math.min(callAmount, getStackTotal(p.chipStack));
          return {
            ...p,
            chipStack: deductFromStack(p.chipStack, callBet),
            bet: p.bet + callBet,
          };
        }
        return p;
      });

      let newState = {
        ...prev,
        players: updatedPlayers,
        pot: addToStack(prev.pot, 10),
      };

      // Next player
      goToNextPlayer(newState);
      // Possibly next stage
      newState = handlePostActionStageCheck(newState);

      return newState;
    });
  }, [goToNextPlayer, handlePostActionStageCheck]);

  const bet = useCallback(
    (amount: number) => {
      setGameState((prev) => {
        // Current player bets "amount"
        const updatedPlayers = prev.players.map((p, i) => {
          if (i === prev.currentPlayerId) {
            const finalBet = Math.min(amount, getStackTotal(p.chipStack));
            return {
              ...p,
              chipStack: deductFromStack(p.chipStack, finalBet),
              bet: p.bet + finalBet,
            };
          }
          return p;
        });

        let newState = {
          ...prev,
          players: updatedPlayers,
          pot: addToStack(prev.pot, amount),
        };

        // Next player
        goToNextPlayer(newState);
        // Possibly next stage
        newState = handlePostActionStageCheck(newState);
        console.log(
          `- Player ${prev.players[prev.currentPlayerId].name} bets ${amount}`
        );
        return newState;
      });
    },
    [goToNextPlayer, handlePostActionStageCheck]
  );

  // =====================
  // 4. Bot Logic
  // =====================
  const botPlayMove = useCallback(() => {
    const currentPlayer = gameState.players[gameState.currentPlayerId];
    // Only proceed if it's actually a bot
    if (!currentPlayer?.isBot) return;

    // Just to simulate a short delay
    setTimeout(() => {
      const randomDecision = Math.random();
      if (randomDecision < 0.33) {
        fold();
      } else if (randomDecision < 0.66) {
        check();
      } else {
        bet(100);
      }
    }, 1500);
  }, [gameState, fold, check, bet]);

  // =====================
  // 5. useEffect: Start Game & Bot Checking
  // =====================
  useEffect(() => {
    initGame();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (gameState.players.length === 0) return;
    const currentPlayer = gameState.players[gameState.currentPlayerId];
    if (currentPlayer?.isBot) {
      botPlayMove();
    }
  }, [gameState.currentPlayerId, gameState.players, botPlayMove]);

  // =====================
  // 6. Public API
  // =====================
  const playerFold = (playerId: number) => {
    if (playerId === gameState.currentPlayerId) fold();
  };

  const playerCheck = (playerId: number) => {
    if (playerId === gameState.currentPlayerId) check();
  };

  const playerCall = (playerId: number) => {
    if (playerId === gameState.currentPlayerId) call();
  };

  const playerBet = (playerId: number, amount: number) => {
    if (playerId === gameState.currentPlayerId) bet(amount);
  };

  return {
    gameState,
    playerFold,
    playerCheck,
    playerCall,
    playerBet,
  };
};
