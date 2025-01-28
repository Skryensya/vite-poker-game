// utils/chipStackUtils.ts

import { Denom, ChipStack } from "../types/poker.types";

// Crea un stack vacío
export function createEmptyStack(): ChipStack {
  return {
    10: 0,
    50: 0,
    100: 0,
    500: 0,
    1000: 0,
  };
}

// Suma dos ChipStack
export function addStacks(a: ChipStack, b: ChipStack): ChipStack {
  const result = createEmptyStack();
  for (const denom of Object.keys(a)) {
    const d = Number(denom) as Denom;
    result[d] = (a[d] || 0) + (b[d] || 0);
  }
  return result;
}

// Resta un stack de otro (útil para side pots)
export function subtractStacks(a: ChipStack, b: ChipStack): ChipStack {
  const result = createEmptyStack();
  for (const denom of Object.keys(a)) {
    const d = Number(denom) as Denom;
    const diff = (a[d] || 0) - (b[d] || 0);
    result[d] = diff > 0 ? diff : 0; // pa' que no quede negativo
  }
  return result;
}

// Convierte un "monto total" a un ChipStack repartiendo de mayor a menor denom
// (Opcional; depende de cómo manejas las fichas)
export function amountToStack(total: number): ChipStack {
  let remaining = total;
  const result = createEmptyStack();
  [1000, 500, 100, 50, 10].forEach((den) => {
    const count = Math.floor(remaining / den);
    if (count > 0) {
      result[den as Denom] += count;
      remaining -= den * count;
    }
  });
  return result;
}

/**
 * Convierte un ChipStack a un número bruto (suma de todas las denominaciones).
 * Ojo que no sabís exactamente cuántas fichas hay, pero si querís comparación
 * rápida, te sirve.
 */
export function stackToNumber(stack: ChipStack): number {
  return Object.keys(stack).reduce((acc, denom) => {
    const d = Number(denom);
    return acc + d * stack[d as keyof ChipStack];
  }, 0);
}
