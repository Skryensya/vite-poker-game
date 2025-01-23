import { Card } from "./Card";

export const FaceDownCards = ({ numberOfCards }: { numberOfCards: number }) => {
  return (
    <div className="flex flex-wrap gap-2  relative ">
      <Card key={0} value={" "} suit={" "} />
      {Array.from({ length: numberOfCards }).map((_, index) => (
        <div
          key={index}
          className="absolute inset-0  "
          style={{
            transform: `translateY(-${index * 0.2}px) translateX(${
              index * 0.2
            }px)`,
          }}
        >
          <Card key={index} value={" "} suit={" "} open={false} />
        </div>
      ))}
    </div>
  );
};
