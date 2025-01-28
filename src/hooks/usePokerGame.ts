import { useState, useEffect, useCallback, useRef } from "react";
import { STARTING_MONEY } from "../utils/constants";
// import { calculateAvailableActions } from "../utils/pokerUtils";
import {
  GameCurrentStage,
  GameState,
  BotDifficulty,
  Card,
} from "../types/poker.types";
import { useDeck } from "./useDeck";
import { usePot } from "./usePot";
import { usePokerPlayers } from "./usePokerPlayers";

const HUMAN_PLAYER_CONFIG = {
  name: "You",
  chipTotal: STARTING_MONEY,
};

const BOT_PLAYERS_CONFIG = [
  {
    name: "Bot 1",
    difficulty: BotDifficulty.EASY,
    chipTotal: STARTING_MONEY,
  },
  {
    name: "Bot 2",
    difficulty: BotDifficulty.MEDIUM,
    chipTotal: STARTING_MONEY,
  },
  {
    name: "Bot 3",
    difficulty: BotDifficulty.HARD,
    chipTotal: STARTING_MONEY,
  },
];

const ROUND_STAGES_ORDER: GameCurrentStage[] = [
  GameCurrentStage.GAME_NOT_STARTED,
  GameCurrentStage.DEALING_HANDS,
  GameCurrentStage.PRE_FLOP,
  GameCurrentStage.FLOP,
  GameCurrentStage.TURN,
  GameCurrentStage.RIVER,
  GameCurrentStage.SHOWDOWN,
  GameCurrentStage.SUFFLE_DECK,
];

export const usePokerGame = () => {
  const { deck, giveHandsToPlayers, getFlop, getTurn, getRiver, originalDeck, resetDeck } =
    useDeck();
  const { pot, addBet, resetPot } = usePot();

  const { players, updatePlayerState, handleTurn, resetPlayers } =
    usePokerPlayers({
      humanPlayer: HUMAN_PLAYER_CONFIG,
      botPlayers: BOT_PLAYERS_CONFIG,
    });

  const [gameState, setGameState] = useState<GameState>({
    deck: [],
    players: players,
    board: { flop: [], turn: [], river: [] },
    burnedCards: [],
    pot: { total: 0, bets: [] },
    showdown: false,
    dealerIndex: 0,
    smallBlindIndex: 1,
    bigBlindIndex: 2,
    currentPlayerId: 0,
    gameCurrentStage: GameCurrentStage.GAME_NOT_STARTED,
    playersActedThisStage: 0,
  });

  useEffect(() => {
    setGameState((prev) => ({
      ...prev,
      deck: [...deck],
    }));
  }, [deck]);

  // Nuevo flag para verificar si el juego ha terminado
  const [hasGameFinished, setHasGameFinished] = useState(false);

  const hasInitialized = useRef(false);

  /**
   * Filters out undefined cards from the burnedCards array.
   * @param burnedCards - The array of burned cards which may contain undefined values.
   * @returns An array of Card objects without undefined values.
   */
  const filterBurnedCards = useCallback(
    (burnedCards: (Card | undefined)[]): Card[] => {
      return burnedCards.filter((bc): bc is Card => bc !== undefined);
    },
    []
  );

  const initGame = useCallback(() => {
    if (!hasGameFinished) {
      if (hasInitialized.current) return;
    } else {
      setHasGameFinished(false);
    }
    hasInitialized.current = true;

    resetPlayers();

    setGameState((prev) => ({
      ...prev,
      deck: [...deck],
      pot: { ...pot },
    }));
  }, [pot, hasGameFinished, deck, resetPlayers]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const resetGame = () => {
    setHasGameFinished(true);
  };

  const advanceGameCurrentStage = () => {
    setGameState((prev) => {
      const currentIndex = ROUND_STAGES_ORDER.indexOf(prev.gameCurrentStage);
      const nextIndex = currentIndex + 1;

      if (nextIndex < ROUND_STAGES_ORDER.length) {
        return {
          ...prev,
          gameCurrentStage: ROUND_STAGES_ORDER[nextIndex],
        };
      } else {
        return {
          ...prev,
          gameCurrentStage: ROUND_STAGES_ORDER[1],
        };
      }
    });
  };

  useEffect(() => {
    const gameStage = gameState.gameCurrentStage;

    if (gameStage === GameCurrentStage.GAME_NOT_STARTED) {
      console.log("GAME_NOT_STARTED");
      return;
    }

    if (gameStage === GameCurrentStage.DEALING_HANDS) {
      const result = giveHandsToPlayers(players.map((p) => p.id));
      if (!result) {
        console.error("No se pudo repartir las cartas");
        return;
      }
      const { playerRecords, remainingDeck } = result;

      const updatedPlayers = players.map((p) => ({
        ...p,
        hand: playerRecords.find((pr) => pr.id === p.id)?.hand ?? [],
      }));

      setGameState((prev) => ({
        ...prev,
        players: updatedPlayers,
        deck: remainingDeck,
      }));
    }

    if (gameStage === GameCurrentStage.PRE_FLOP) {
      console.log("PRE_FLOP");
    }

    if (gameStage === GameCurrentStage.FLOP) {
      const { flop, burnedCards, remainingDeck } = getFlop();

      if (!flop || !burnedCards || !remainingDeck) {
        console.error(
          "No se pudo obtener el flop, las cartas quemadas o el deck"
        );
        return;
      }

      setGameState((prev) => ({
        ...prev,
        board: { ...prev.board, flop: flop },
        burnedCards: [...prev.burnedCards, ...filterBurnedCards(burnedCards)],
        deck: remainingDeck,
      }));
    }

    if (gameStage === GameCurrentStage.TURN) {
      const { turn, burnedCards, remainingDeck } = getTurn();

      if (!turn || !burnedCards || !remainingDeck) {
        console.error(
          "No se pudo obtener la turn, las cartas quemadas o el deck"
        );
        return;
      }

      setGameState((prev) => ({
        ...prev,
        board: { ...prev.board, turn: turn },
        burnedCards: [...prev.burnedCards, ...filterBurnedCards(burnedCards)],
        deck: remainingDeck,
      }));
    }

    if (gameStage === GameCurrentStage.RIVER) {
      const { river, burnedCards, remainingDeck } = getRiver();

      if (!river || !burnedCards || !remainingDeck) {
        console.error(
          "No se pudo obtener el river, las cartas quemadas o el deck"
        );
        return;
      }

      setGameState((prev) => ({
        ...prev,
        board: { ...prev.board, river: river },
        burnedCards: [...prev.burnedCards, ...filterBurnedCards(burnedCards)],
        deck: remainingDeck,
      }));
    }

    if (gameStage === GameCurrentStage.SHOWDOWN) {
      console.log("SHOWDOWN");
      // setHasGameFinished(true);
    }

    if (gameStage === GameCurrentStage.SUFFLE_DECK) {
      console.log("SUFFLE_DECK");
      resetDeck();
      // clean flop, turn, river, and hands
      setGameState((prev) => ({
        ...prev,
        board: { flop: [], turn: [], river: [] },
        players: prev.players.map((p) => ({ ...p, hand: [] })),
        burnedCards: [],
      }));
    }
  }, [gameState.gameCurrentStage, players]);

  const playTurn = useCallback(() => {
    const currentPlayer = gameState.players[gameState.currentPlayerId];
    console.log({ currentPlayer: currentPlayer.name });
    advanceGameCurrentStage();
    if (currentPlayer.isBot) {
      handleTurn(currentPlayer.id);
      setTimeout(() => {
        playTurn();
      }, 1000);
    }
  }, [gameState, handleTurn]);

  return {
    gameState,
    handleTurn,
    addBet,
    setHasGameFinished, // Función para establecer hasGameFinished
    // Otros métodos que desees exponer
    resetGame,
    playTurn,
    originalDeck,
  };
};
