import { useState } from "react";
import { Player, BotDifficulty } from "../types/poker.types";
import { STARTING_MONEY } from "../utils/constants";

type HumanPlayerInput = {
  name: string;
  chipTotal: number;
};

type UsePokerPlayersProps = {
  humanPlayer: HumanPlayerInput;
  botPlayers: {
    difficulty: BotDifficulty;
    name: string;
    chipTotal: number; // Asegúrate de incluir chipTotal
  }[];
};

export const usePokerPlayers = ({
  humanPlayer,
  botPlayers,
}: UsePokerPlayersProps) => {
  // Definir createPlayers antes de usarlo
  const createPlayers = (
    humanPlayer: HumanPlayerInput,
    botPlayers: { difficulty: BotDifficulty; name: string; chipTotal: number }[]
  ): Player[] => {
    const human: Player = {
      id: 0,
      name: humanPlayer.name,
      chipTotal: humanPlayer.chipTotal,
      hand: [],
      isFolded: false,
      isTurn: false,
      isBot: false,
    };

    const bots: Player[] = botPlayers.map((bot, index) => ({
      id: index + 1,
      name: bot.name,
      hand: [],
      chipTotal: bot.chipTotal, // Usa el chipTotal proporcionado
      isFolded: false,
      difficulty: bot.difficulty,
      isTurn: false,
      isBot: true,
    }));

    return [human, ...bots];
  };

  // Inicializar el estado directamente con createPlayers
  const [players, setPlayers] = useState<Player[]>(() =>
    createPlayers(humanPlayer, botPlayers)
  );

  // Si deseas actualizar los jugadores cuando cambian las props, puedes usar useEffect
  // Si los jugadores no cambian después de la inicialización, puedes omitir esto
  /*
  useEffect(() => {
    setPlayers(createPlayers(humanPlayer, botPlayers));
  }, [humanPlayer, botPlayers]);
  */

  const updatePlayerState = (
    playerId: number,
    updateFn: (player: Player) => Partial<Player>
  ) => {
    setPlayers((prevPlayers) =>
      prevPlayers.map((player) =>
        player.id === playerId ? { ...player, ...updateFn(player) } : player
      )
    );
  };

  const botDecisionLogic = (bot: Player & { difficulty: BotDifficulty }) => {
    if (bot.difficulty === "easy") {
      return Math.random() > 0.5 ? "call" : "fold";
    } else if (bot.difficulty === "medium") {
      return Math.random() > 0.3 ? "call" : "raise";
    } else if (bot.difficulty === "hard") {
      return Math.random() > 0.2 ? "raise" : "all-in";
    }
    return "fold";
  };

  const handleTurn = (playerId: number) => {
    setPlayers((prevPlayers) =>
      prevPlayers.map((player) => {
        if (player.id === playerId) {
          if ("difficulty" in player) {
            const decision = botDecisionLogic(
              player as Player & { difficulty: BotDifficulty }
            );
            console.log(`Bot ${playerId} decided to ${decision}`);
            // Actualiza los chips o cualquier otro estado relevante basado en la decisión
          }
          return { ...player, isTurn: true };
        } else {
          return { ...player, isTurn: false };
        }
      })
    );
  };

  const resetPlayers = () => {
    setPlayers((prevPlayers) =>
      prevPlayers.map((player) => ({
        ...player,
        chipTotal: player.id === 0 ? humanPlayer.chipTotal : STARTING_MONEY,
        isFolded: false,
        isTurn: false,
        hand: [],
      }))
    );
  };

  return {
    players,
    updatePlayerState,
    handleTurn,
    resetPlayers,
  };
};
