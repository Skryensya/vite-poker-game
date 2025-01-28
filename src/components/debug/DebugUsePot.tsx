import { useState, useEffect } from "react";
import { usePot } from "../../hooks/usePot";
import { Pot, Bet } from "../../types/poker.types";

export const DebugUsePot = () => {
  // Destructure the updated usePot hook
  const {
    pot,
    addBet,
    payPotToWinners,
    resetPot, // New function added to reset the pot
    potHistory, // New state to keep track of pot history
  } = usePot();

  const [currentStep, setCurrentStep] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [hasCompleted, setHasCompleted] = useState(false);

  // Step queue for processing updates sequentially
  const [stepQueue, setStepQueue] = useState<(() => void)[]>([]);

  const simplifyPot = (potToNumber: Pot) => {
    const simplePot = {
      total: potToNumber.total,
      bets: potToNumber?.bets?.flatMap((bet: Bet) => ({
        playerId: bet.playerId,
        total: bet.betAmount,
      })),
    };
    setLogs((prev) => [...prev, JSON.stringify(simplePot, null, 2)]);
  };

  const steps = [
    () => {
      console.log("=== Initial Pot ===");
      setStepQueue((prev) => [...prev, () => simplifyPot(pot)]);
    },
    () => {
      console.log("=== Player 1 bets 100 ===");
      addBet(1, 100, false);
      setStepQueue((prev) => [...prev, () => simplifyPot(pot)]);
    },
    () => {
      console.log("=== Player 2 bets 200 ===");
      addBet(2, 200, false);
      setStepQueue((prev) => [...prev, () => simplifyPot(pot)]);
    },
    () => {
      console.log("=== Player 3 goes ALL-IN with 500 ===");
      addBet(3, 500, true);
      setStepQueue((prev) => [...prev, () => simplifyPot(pot)]);
    },
    () => {
      console.log("=== Player 1 calls ===");
      addBet(1, 400, false);
      setStepQueue((prev) => [...prev, () => simplifyPot(pot)]);
    },
    () => {
      console.log("=== Player 2 raises to 700 (ALL-IN) ===");
      addBet(2, 500, true);
      setStepQueue((prev) => [...prev, () => simplifyPot(pot)]);
    },

    () => {
      console.log("=== Player 1 calls ===");
      addBet(1, 3000, false);
      setStepQueue((prev) => [...prev, () => simplifyPot(pot)]);
    },
    () => {
      console.log("=== Resolve All-In: Player 3 wins ===");
      const { distribution, hasRemaining } = payPotToWinners([3]);
      console.log(distribution, hasRemaining);
      setStepQueue((prev) => [...prev, () => simplifyPot(pot)]);
    },
    () => {
      console.log("=== Resolve All-In: Player 2 wins ===");
      const { distribution, hasRemaining } = payPotToWinners([2]);
      console.log(distribution, hasRemaining);
      setStepQueue((prev) => [...prev, () => simplifyPot(pot)]);
    },
    () => {
      console.log("=== Resolve All-In: Player 1 wins ===");
      const { distribution, hasRemaining } = payPotToWinners([1]);
      console.log(distribution, hasRemaining);
      setStepQueue((prev) => [...prev, () => simplifyPot(pot)]);
    },
    () => {
      console.log("=== Pot History ===");
      console.log(JSON.stringify(potHistory, null, 2));
    },
  ];

  useEffect(() => {
    if (stepQueue.length > 0) {
      const nextStep = stepQueue[0];
      nextStep();
      setStepQueue((prev) => prev.slice(1));
    }
  }, [pot, stepQueue]);

  const handleNextStep = () => {
    if (currentStep < steps.length) {
      steps[currentStep]();
      setCurrentStep((prev) => prev + 1);
      if (currentStep + 1 === steps.length) {
        setHasCompleted(true);
      }
    }
  };

  const handleReset = () => {
    setLogs([]);
    setCurrentStep(0);
    setHasCompleted(false);
    setStepQueue([]);
    resetPot(); // Reset the pot using the new resetPot function
  };

  return (
    <div>
      <h2 className="text-xl font-semibold">Pot console.Logic Step-by-Step</h2>
      <div className="flex space-x-4 mt-4 sticky top-0">
        <button
          onClick={handleNextStep}
          disabled={hasCompleted}
          className={`px-4 py-2 bg-blue-500 text-white rounded ${
            hasCompleted ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-600"
          }`}
        >
          {hasCompleted ? "All Steps Completed" : "Next Step"}
        </button>
        <button
          onClick={handleReset}
          disabled={currentStep === 0 && logs.length === 0}
          className={`px-4 py-2 bg-red-500 text-white rounded ${
            currentStep === 0 && logs.length === 0
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-red-600"
          }`}
        >
          Reset
        </button>
      </div>
    </div>
  );
};
