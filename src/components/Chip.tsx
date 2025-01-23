type ChipProps = {
  denom: number; // Chip denomination
};

export function Chip({ denom }: ChipProps) {
  // Determine color based on denom (denomination)
  const chipColors: Record<number, string> = {
    10: "bg-white text-black border-black",
    50: "bg-red-600 text-white border-white",
    100: "bg-blue-600 text-white border-white",
    500: "bg-green-700 text-white border-white",
    1000: "bg-black text-white border-white",
  };

  const denomLabels: Record<number, string> = {
    10: "10",
    50: "50",
    100: "100",
    500: "500",
    1000: "1k",
  };

  const selectedColor = chipColors[denom] || chipColors[1]; // Default to red if denom not found

  return (
    <div className={`relative  h-6 w-6 flex items-center justify-center`}>
      <div
        className={`absolute   h-6 w-6  ${selectedColor} translate-y-[2%] translate-x-[2%] rounded-full  flex items-center justify-center sepia-75 scale-110 shadow-md`}
      ></div>
      <div
        className={`absolute   h-6 w-6  ${selectedColor}   flex items-center justify-center border-3 border-offset-2 border-dashed rounded-full`}
      >
        <span
          className={`  text-[9px]  drop-shadow-md pointer-events-none`}
        >
          {denomLabels[denom]}
        </span>
      </div>
    </div>
  );
}
