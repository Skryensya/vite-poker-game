export type Card = {
  suit: string;
  value: string;
  key: string;
};

export type PlayerRecord = {
  id: number;
  hand: Card[];
};

export type Denom = 10 | 50 | 100 | 500 | 1000;
export type ChipStack = Record<Denom, number>;

export type Player = {
  id: number;
  name: string;
  hand: Card[];
  chipTotal: number;
  isFolded: boolean;
  isTurn: boolean;
  isBot: boolean;
};

export enum BotDifficulty {
  EASY = "easy",
  MEDIUM = "medium",
  HARD = "hard",
}

/**
 * Defines the overall state of the poker game at any given point.
 */

export enum GameCurrentStage {
  GAME_NOT_STARTED = "GAME_NOT_STARTED",
  DEALING_HANDS = "DEALING_HANDS",
  PRE_FLOP = "PRE_FLOP",
  FLOP = "FLOP",
  TURN = "TURN",
  RIVER = "RIVER",
  SHOWDOWN = "SHOWDOWN",
  SUFFLE_DECK = "SUFFLE_DECK",
}

export interface Bet {
  playerId: number;
  betAmount: number;
  isAllIn: boolean;
}

export interface Pot {
  total: number;
  bets: Bet[];
}

export type PotAction =
  | {
      type: "ADD_BET";
      playerId: number;
      amount: number;
      isAllIn: boolean;
      timestamp: number;
    }
  | {
      type: "PAY_WINNERS";
      winnerIds: number[];
      distribution: Record<number, number>;
      timestamp: number;
    };

export type GameState = {
  deck: Card[]; // La baraja actual de cartas para ser sacadas
  players: Player[]; // Todos los jugadores en el juego
  board: {
    flop: Card[];
    turn: Card[];
    river: Card[];
  }; // Las cartas comunitarias compartidas (flop + turn + river)
  burnedCards: Card[]; // Cartas descartadas ("quemadas") antes de cada ronda de reparto
  pot: Pot; // La cantidad total de fichas en el pozo
  showdown: boolean; // Indica si hemos llegado al showdown
  dealerIndex: number; // Índice del dealer actual
  smallBlindIndex: number; // Índice del jugador que pone la ciega pequeña
  bigBlindIndex: number; // Índice del jugador que pone la ciega grande
  currentPlayerId: number; // ID del jugador que tiene el turno actual
  gameCurrentStage: GameCurrentStage; // Nueva propiedad para rastrear la etapa actual de la ronda
  playersActedThisStage: number; // Nueva propiedad para rastrear la etapa actual de la ronda
};

export interface BoardState {
  flop: Card[];
  turn: Card[];
  river: Card[];
}
export interface GameTableProps {
  debugMode?: boolean;
  remainingDeckCards: Card[];
  burnedCards: Card[];
  board: BoardState; // Object with flop, turn, river
  pot: Pot;
  showdown: boolean;
  //   onDealFlop: () => void;
  //   onDealTurn: () => void;
  //   onDealRiver: () => void;
  //   onShowdown: () => void;
}
