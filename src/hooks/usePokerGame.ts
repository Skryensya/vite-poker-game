import { useState, useEffect, useCallback } from "react";
import {
  // ChipStack,
  GameState,
  RoundStage,
  BotPlayer,
  Pot,
  Bet,
} from "../types/poker.types";
import {
  STARTING_SMALL_BLIND_AMOUNT,
  STARTING_BIG_BLIND_AMOUNT,
  BOT_PLAYERS_COUNT,
} from "../utils/constants";
import {
  createDeck,
  shuffleDeck,
  deductFromStack,
  createPot,
  addBetToPot,
  getStackTotal,
  addToStack,
  createPlayers,
} from "../utils/pokerUtils";

/**
 * Utility that returns how many players are still active (not folded).
 */
function countActivePlayers(players: GameState["players"]) {
  return players.filter((p) => !p.isFolded).length;
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
    pots: [],
    showdown: false,
    dealerIndex: 0,
    smallBlindIndex: 1,
    bigBlindIndex: 2,
    currentPlayerId: 0,
    roundStage: RoundStage.PRE_FLOP,
    playersActedThisStage: 0,
    availableActions: [],
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
      pots: [createPot(0, [])],
      showdown: false,
      dealerIndex: 0,
      smallBlindIndex: 1,
      bigBlindIndex: 2,
      currentPlayerId: 0,
      roundStage: RoundStage.PRE_FLOP,
      playersActedThisStage: 0,
      // TODO: REVISIT HOW TO HANDLE AVAILABLE ACTIONS ON INIT
      availableActions: ["check", "call", "raise"],
    });
  }, []);

  const calculateAvailableActions = useCallback((state: GameState) => {
    console.log("calculateAvailableActions");
    const currentPlayer = state.players[state.currentPlayerId];
    const AA: string[] = [];

    if (currentPlayer.isFolded) return AA;

    if (state.roundStage === RoundStage.PRE_FLOP) {
      if (currentPlayer.isSmallBlind) AA.push("placeSmallBlind");
      if (currentPlayer.isBigBlind) AA.push("placeBigBlind");
      return AA;
    }
    if (state.roundStage !== RoundStage.SHOWDOWN) {
      AA.push("fold");
    }

    // if another player has already placed a bet, we can't check
    if (
      state.pots.some((p: Pot) =>
        p.bets.some((b: Bet) => getStackTotal(b.chipStack) > 0)
      )
    ) {
      AA.push("check");
    }

    AA.push("call");
    AA.push("raise");
    return AA;
  }, []);

  const afterPlayerAction = useCallback((draft: GameState): GameState => {
    const availableActions = calculateAvailableActions(draft);
    const activePlayers = countActivePlayers(draft.players);

    // 1) Increment how many players have acted
    const playersActed = draft.playersActedThisStage + 1;
    let newState = {
      ...draft,
      availableActions,
    };

    const activePot = draft.pots.find((p: Pot) => p.isActive);

    const betTotals =
      activePot?.bets.map((b: Bet) => getStackTotal(b.chipStack)) || [];
    const maxBet = betTotals.length > 0 ? Math.max(...betTotals) : 0;

    const foldedPlayers = draft.players
      .filter((p) => p.isFolded)
      .map((p) => p.id);

    const allActivePlayersMatched = activePot?.bets
      .filter((b: Bet) => !foldedPlayers.includes(b.playerId))
      .some((b: Bet) => getStackTotal(b.chipStack) === maxBet);

    console.log({ ...activePot });
    console.table({ maxBet, allActivePlayersMatched });

    // 2) If all active players have acted and either folded or matched the max bet => nextRoundStage

    if (playersActed >= activePlayers && allActivePlayersMatched) {
      newState = nextRoundStageFromState(newState);
    }

    return newState;
  }, []);

  /**
   * Move turn to the next non-folded player
   */
  const goToNextPlayer = useCallback((draft: GameState) => {
    let nextId = draft.currentPlayerId;
    const totalPlayers = draft.players.length;

    // find the next player that hasn't folded
    do {
      nextId = (nextId + 1) % totalPlayers;
    } while (draft.players[nextId].isFolded);

    draft.currentPlayerId = nextId;
  }, []);

  // =====================
  // 3. Player Actions
  // =====================
  const fold = useCallback(() => {
    setGameState((prev) => {
      // 1) Fold this player
      const updatedPlayers = prev.players.map((p, i) =>
        i === prev.currentPlayerId ? { ...p, isFolded: true } : p
      );

      // 2) Incorporate that into the new state
      let newState: GameState = {
        ...prev,
        players: updatedPlayers,
        availableActions: calculateAvailableActions(prev),
      };

      // 3) Pass turn to next player (in the same "draft")
      goToNextPlayer(newState);

      // 4) Check if we need to advance roundStage
      newState = afterPlayerAction(newState);

      console.log(`- Player ${prev.players[prev.currentPlayerId].name} folds`);
      return newState;
    });
  }, [gameState, goToNextPlayer, afterPlayerAction]);

  const check = useCallback(() => {
    const { roundStage, availableActions } = gameState;

    if (roundStage === RoundStage.SHOWDOWN) return;
    if (!availableActions.includes("check")) {
      console.log("check", availableActions);
      console.log(
        `- Player "${
          gameState.players[gameState.currentPlayerId].name
        }" cannot check`
      );
      return;
    }

    setGameState((prev) => {
      // CONSOLE LOG WHICH PLAYER (NAME) checks
      console.log(`- Player ${prev.players[prev.currentPlayerId].name} checks`);

      let newState = { ...prev };

      // Pass turn
      goToNextPlayer(newState);
      // Possibly next stage
      newState = afterPlayerAction(newState);
      return newState;
    });
  }, [gameState, goToNextPlayer, afterPlayerAction]);

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
      newState = afterPlayerAction(newState);

      return newState;
    });
  }, [goToNextPlayer, afterPlayerAction]);

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
        newState = afterPlayerAction(newState);
        console.log(
          `- Player ${prev.players[prev.currentPlayerId].name} bets ${amount}`
        );
        return newState;
      });
    },
    [goToNextPlayer, afterPlayerAction]
  );

  // =====================
  // 4. Bot Logic
  // =====================
  const botPlayMove = useCallback(() => {
    const currentPlayer = gameState.players[gameState.currentPlayerId];
    // Only proceed if it's actually a bot
    if (!(currentPlayer as BotPlayer)?.isBot) return;

    if (currentPlayer.isFolded) return;

    // Just to simulate a short delay
    setTimeout(() => {
      if (currentPlayer.isSmallBlind) {
        bet(STARTING_SMALL_BLIND_AMOUNT);
        return;
      }
      if (currentPlayer.isBigBlind) {
        bet(STARTING_BIG_BLIND_AMOUNT);
        return;
      }
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

  // Game Loop
  useEffect(() => {
    if (gameState.players.length === 0) return;

    if ((gameState.players[gameState.currentPlayerId] as BotPlayer)?.isBot) {
      botPlayMove();
    }
  }, [gameState, botPlayMove, calculateAvailableActions]);

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
