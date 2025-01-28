export const getRandomNumber = (): number => {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    // Normalize to [0, 1)
    return array[0] / (0xffffffff + 1);
  } else {
    // Fallback to Math.random if `crypto` is unavailable
    console.warn(
      "crypto.getRandomValues is not available. Falling back to Math.random."
    );
    return Math.random();
  }
};
