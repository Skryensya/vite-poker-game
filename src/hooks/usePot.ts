import { useState, useCallback } from "react";
import { Pot, PotAction } from "../types/poker.types";

// Hook principal
export function usePot() {
  const [pot, setPot] = useState<Pot>(createPot());
  const [potHistory, setPotHistory] = useState<PotAction[]>([]);

  // ================== ADD BET ==================
  const addBet = useCallback(
    (playerId: number, betAmount: number, isAllIn: boolean) => {
      setPot((prev) => {
        const newPot = handleBet(prev, playerId, betAmount, isAllIn);
        setPotHistory((history) => [
          ...history,
          {
            type: "ADD_BET",
            playerId,
            amount: betAmount,
            isAllIn,
            timestamp: Date.now(),
          },
        ]);
        return newPot;
      });
    },
    []
  );

  // ================== PAY WINNERS ==================
  /**
   * - Reparte el dinero a los ganadores.
   * - Si un jugador está all-in, no puede llevarse más de lo que apostó multiplicado
   *   por la cantidad total de jugadores en el pot.
   * - Si algún ganador está capado y sobran fichas, se reparten entre el resto
   *   de los ganadores que no estén capados.
   * - Devuelve un objeto con la distribución y un booleano indicando si queda restante en el pot.
   */
  const payPotToWinners = useCallback(
    (winnerIds: number[]) => {
      const distribution: Record<number, number> = {};

      // Inicializamos la distribución en 0.
      winnerIds.forEach((id) => {
        distribution[id] = 0;
      });

      if (!pot.bets.length) return { distribution, hasRemaining: false };

      const totalPot = pot.total;

      console.log("=== TOTAL POT ===", totalPot);
      if (totalPot <= 0) return { distribution, hasRemaining: false };

      // Tomamos los que ganan dentro del pot actual
      const winnersInPot = pot.bets.filter((b) =>
        winnerIds.includes(b.playerId)
      );

      console.log("=== WINNERS IN POT ===", winnersInPot);

      // Si en este pot no ganó ninguno, no se paga nada
      if (!winnersInPot.length) return { distribution, hasRemaining: false };

      // Cantidad de jugadores aportando en este pot (para calcular el cap de cada all-in)
      const totalPlayersInPot = pot.bets.length;
      console.log("=== TOTAL PLAYERS IN POT ===", totalPlayersInPot);

      // 1. Calculamos la parte base a repartir si nadie estuviera capado
      let potLeft = totalPot; // cantidad de dinero que queda por repartir

      // 2. Armamos un array de ganadores con su cap.
      //    Cap = betDelJugador * totalPlayersInPot si está all-in, si no, Infinity.
      const winnersData = winnersInPot.map((w) => {
        const betAmount = w.betAmount;
        return {
          playerId: w.playerId,
          cap: w.isAllIn ? betAmount * totalPlayersInPot : Infinity,
          amountWon: 0,
        };
      });

      // 3. Iteramos hasta que no queden fichas por repartir o hasta que todos estén capados
      let activeWinners = winnersData.filter((wd) => wd.cap > 0);

      while (potLeft > 0 && activeWinners.length > 0) {
        // Reparto equitativo entre quienes aún no llegan a su cap
        const share = Math.floor(potLeft / activeWinners.length);

        // Si la cantidad no es suficiente para repartir, paramos
        if (share <= 0) break;

        // Recorremos a cada winner
        for (const wd of activeWinners) {
          // Cuánto falta para que llegue a su cap
          const room = wd.cap - wd.amountWon;
          if (room <= 0) {
            // Ya está capado, saltamos
            continue;
          }

          // Lo que le tocaría recibiendo share completo
          const toAdd = Math.min(share, room);
          wd.amountWon += toAdd;
          potLeft -= toAdd;
        }

        // Actualizamos la lista de activos (los que aún pueden recibir más)
        activeWinners = winnersData.filter((wd) => wd.amountWon < wd.cap);
      }

      // Agregamos lo ganado al distribution final
      winnersData.forEach((wd) => {
        distribution[wd.playerId] =
          (distribution[wd.playerId] || 0) + wd.amountWon;
      });

      console.log("=== FINAL DISTRIBUTION ===", distribution);

      //   make sure each entry in distribution is divisible by 10 if not, throw an error
      for (const amount of Object.values(distribution)) {
        if (amount % 10 !== 0) {
          console.log("=== DISTRIBUTION NOT DIVISIBLE BY 10 ===", distribution);
          throw new Error("Distribution amount must be divisible by 10");
        }
      }

      // Determinar si queda restante en el pot
      const hasRemaining = potLeft > 0;

      if (hasRemaining) {
        // Actualizamos el pot con el restante
        setPot((prevPot) => ({
          ...prevPot,
          total: potLeft,
        }));
      } else {
        // Reseteamos el pot, porque la mano terminó
        setPot(createPot());
      }

      // Log the payout action
      setPotHistory((history) => [
        ...history,
        {
          type: "PAY_WINNERS",
          winnerIds,
          distribution,
          hasRemaining,
          timestamp: Date.now(),
        },
      ]);

      return { distribution, hasRemaining };
    },
    [pot]
  );

  // ================== RESET POT ==================
  const resetPot = useCallback(() => {
    setPot(createPot());
    setPotHistory([]);
    console.log("=== POT AND HISTORY RESET ===");
  }, []);

  return { pot, addBet, payPotToWinners, resetPot, potHistory };
}

// ================== CREATE POT ==================
function createPot(): Pot {
  return { total: 0, bets: [] };
}

// ================== HANDLE BET ==================
/**
 * - Agrega la apuesta al pot actual.
 * - Marca al jugador como all-in si corresponde.
 * - No manejamos side pots aquí; la lógica de "cap" de un all-in se maneja en el payout.
 */
function handleBet(
  currentPot: Pot,
  playerId: number,
  betAmount: number,
  isAllIn: boolean
): Pot {
  // if bet amount is not divisible by 10 throw an error
  if (betAmount % 10 !== 0) {
    throw new Error("Bet amount must be divisible by 10");
  }

  const updatedPot: Pot = {
    total: currentPot.total,
    bets: currentPot.bets.map((bet) => ({ ...bet })),
  };

  // Encontrar o crear la apuesta de este jugador
  let playerBet = updatedPot.bets.find((b) => b.playerId === playerId);
  if (!playerBet) {
    playerBet = {
      playerId,
      betAmount: 0,
      isAllIn: false,
    };
    updatedPot.bets.push(playerBet);
  }

  // Sumamos la apuesta a lo que ya tenía
  playerBet.betAmount += betAmount;

  // Actualizamos el total del pot
  updatedPot.total += betAmount;

  if (isAllIn) {
    playerBet.isAllIn = true;
    console.log(
      `=== Player ${playerId} se fue all-in con ${playerBet.betAmount} ===`
    );
  }

  return updatedPot;
}
