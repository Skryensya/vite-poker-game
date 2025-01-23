import { Chip } from "./Chip";
import { MAX_CHIPS_PER_ROW } from "../utils/constants";
import { getStackTotalCLP } from "../utils/pokerUtils";
import { ChipStack as ChipStackType, Denom } from "../types/poker.types";


export const ChipStack = ({ stack }: { stack: ChipStackType }) => {
  const chipSize = 32;

  const rowOffset = { x: 16, y: 25 }; // Offset for each new row

  const denomPlacements: Record<Denom, { x: number }> = {
    [1000]: { x: chipSize * 0 },
    [500]: { x: chipSize * 1 },
    [100]: { x: chipSize * 2 },
    [50]: { x: chipSize * 3 },
    [10]: { x: chipSize * 4 },
  };

  //   Calc number of rows to set the height based on it
  const numRows = Math.ceil(
    Object.values(stack).reduce((acc, count) => acc + count, 0) /
      MAX_CHIPS_PER_ROW
  );

  return (
    <div className="isolate ">
      <div style={{ height: `${MAX_CHIPS_PER_ROW * 5}px` }}>
        {getStackTotalCLP(stack)}
      </div>

      <div
        className={`flex flex-wrap gap-2 relative`}
        style={{
          height: `${numRows * 5.8}px`,
        }}
      >
        {Object.entries(stack).map(([denomStr, count]) => {
          const denom = Number(denomStr) as Denom;

          return Array.from({ length: count }).map((_, index) => {
            const row = Math.floor(index / MAX_CHIPS_PER_ROW);
            const indexInRow = index % MAX_CHIPS_PER_ROW;

            return (
              <div
                key={`${denom}-${index}`}
                className="absolute"
                style={{
                  left: denomPlacements[denom].x + row * rowOffset.x,
                  top: row * rowOffset.y,
                  transform: `translateY(-${indexInRow * 10}%) translateX(${
                    indexInRow * 2.5
                  }%)`,
                  zIndex: row, // Earlier rows appear on top
                }}
              >
                <Chip denom={denom} />
              </div>
            );
          });
        })}
      </div>
    </div>
  );
};
