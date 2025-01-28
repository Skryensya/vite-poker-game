import {
  Card,
  ChipStack,
  Denom,
  Player,
  BotPlayer,
  Pot,
  GameState,
  gameCurrentStage,
  Bet,
} from "../types/poker.types";
import {
  DENOMINATIONS,
  SUITS,
  VALUES,
  STARTING_MONEY,
  PLAYER_NAMES,
  BOT_PLAYERS_DIFFICULTY,
} from "./constants";

/*
========================================
    STACK UTILS
========================================
*/

export const createChipStack = (total: number): ChipStack => {
  // Define chip denominations in descending order
  const denominations = DENOMINATIONS;

  // Initialize the stack with zero counts for each denomination
  const stack: ChipStack = {
    10: 0,
    50: 0,
    100: 0,
    500: 0,
    1000: 0,
  };
  denominations.forEach((denom) => {
    stack[denom as Denom] = 0;
  });

  let remaining = total;

  // Phase 1: Balanced Round-Robin Assignment
  let assignedInThisRound: boolean;

  do {
    assignedInThisRound = false;

    for (const denom of denominations) {
      if (remaining >= denom) {
        stack[denom as Denom] += 1;
        remaining -= denom;
        assignedInThisRound = true;

        // Debug information
        // console.log(`Assigned 1x${denom}, remaining total: ${remaining}`);
      }
    }
  } while (remaining > 0 && assignedInThisRound);

  // Phase 2: Fill Remaining with Largest Denominations
  if (remaining > 0) {
    for (const denom of denominations) {
      if (remaining >= denom) {
        const count = Math.floor(remaining / denom);
        stack[denom as Denom] += count;
        remaining -= denom * count;

        // Debug information
        // console.log(
        //   `Phase 2: Assigned ${count}x${denom}, remaining total: ${remaining}`
        // );
      }
    }
  }

  // Final Check for Remaining Amount
  if (remaining > 0) {
    console.warn(
      `Unable to distribute the remaining ${remaining} with available denominations.`
    );
  }

  return stack;
};

export const deductFromStack = (
  stack: ChipStack,
  amount: number
): ChipStack => {
  const newStack = { ...stack };
  let remaining = amount;

  // Start from largest denominations
  for (const denom of DENOMINATIONS.slice().reverse()) {
    while (remaining >= denom && newStack[denom as Denom] > 0) {
      newStack[denom as Denom]--;
      remaining -= denom;
    }
    if (remaining === 0) break;
  }
  return newStack;
};

export const addToStack = (stack: ChipStack, amount: number): ChipStack => {
  const newStack = { ...stack };
  let remaining = amount;

  for (const denom of DENOMINATIONS.slice().reverse()) {
    const count = Math.floor(remaining / denom);
    newStack[denom as Denom] += count;
    remaining = remaining % denom;
  }
  return newStack;
};

export const getStackTotal = (stack: Record<number, number>): number =>
  DENOMINATIONS.reduce((sum, denom) => sum + denom * (stack[denom] || 0), 0);

export const getStackTotalCLP = (stack: Record<number, number>): string => {
  const total = DENOMINATIONS.reduce(
    (sum, denom) => sum + denom * (stack[denom] || 0),
    0
  );
  return total.toLocaleString("es-CL", { style: "currency", currency: "CLP" });
};

export const actionGuard = (gameState: GameState, actionToValidate: string) => {
  //  check if the action is available in the gameState
  if (!gameState.availableActions.includes(actionToValidate)) {
    console.log("actionGuard", gameState.availableActions);
    console.log(
      `- Player "${
        gameState.players[gameState.currentPlayerId].name
      }" cannot ${actionToValidate}`
    );
    return false;
  }
  return true;
};

export const calculateAvailableActions = (state: GameState) => {
  // console.log("calculateAvailableActions");
  const currentPlayer = state.players[state.currentPlayerId];
  const AA: string[] = [];

  if (currentPlayer.isFolded) return AA;

  if (state.gameCurrentStage === gameCurrentStage.PRE_FLOP) {
    if (currentPlayer.isSmallBlind) AA.push("placeSmallBlind");
    if (currentPlayer.isBigBlind) AA.push("placeBigBlind");
    return AA;
  }
  if (state.gameCurrentStage !== gameCurrentStage.SHOWDOWN) {
    AA.push("fold");
  }

  // if another player has already placed a bet in this round, we can't check
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
};
