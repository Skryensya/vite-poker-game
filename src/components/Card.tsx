type CardProps = {
  value?: string;
  suit?: string;
  open?: boolean;
  variant?: "big" | "tiny";
};

export function Card({
  value = "A",
  suit = "♠",
  open = false,
  variant = "big",
}: CardProps) {
  // Determina el color del palo (♠ y ♣ = negro, ♥ y ♦ = rojo)
  const suitColor = ["♦", "♥"].includes(suit) ? "text-red-600" : "text-black";

  // Definimos tamaños según la variante
  const sizeClasses = variant === "tiny" ? "w-12 h-20" : "w-32 h-48";

  // Clases condicionales de texto para cada variante
  // (pa' los valores en esquinas y el palo grande central)
  const cornerValueClass = `${
    variant === "tiny" ? "text-sm" : "text-xl"
  } font-bold ${suitColor}`;
  const cornerSuitClass = `${
    variant === "tiny" ? "text-sm" : "text-xl"
  } ${suitColor}`;
  const centerSuitClass = `${
    variant === "tiny" ? "text-3xl" : "text-6xl"
  } font-bold ${suitColor}`;

  return (
    <div className={`relative ${sizeClasses} perspective`}>
      <div
        className={`duration-500 transform-style preserve-3d relative w-full h-full ${
          open ? "" : "rotate-y-180"
        }`}
      >
        {/* Cara frontal */}
        <div className="absolute w-full h-full backface-hidden bg-white border border-gray-300 rounded-xl p-2">
          {/* Valor y palo arriba-izq */}
          <div className="absolute top-2 left-2 flex flex-col items-center">
            <div className={cornerValueClass}>{value}</div>
            {variant !== "tiny" && (
              <div className={cornerSuitClass}>{suit}</div>
            )}
          </div>

          {/* Valor y palo abajo-der (rotado) */}
          <div className="absolute bottom-2 right-2 flex flex-col items-center rotate-180">
            <div className={cornerValueClass}>{value}</div>
            {variant !== "tiny" && (
              <div className={cornerSuitClass}>{suit}</div>
            )}
          </div>

          {/* Palo grande al centro */}
          <div className="w-full h-full flex items-center justify-center">
            <div className={centerSuitClass}>{suit}</div>
          </div>
        </div>

        {/* Dorso de la carta con patrón */}
        <div
          className="absolute w-full h-full bg-red-500 border border-gray-300/50 shadow rounded-xl flex items-center justify-center rotate-y-180 backface-hidden"
          style={{
            transform: "rotateY(180deg)",
            backgroundImage:
              "url('https://opengameart.org/sites/default/files/card%20back%20red.png')", // Add your pattern image here
            backgroundSize: "cover", // Adjusted to cover the card size
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center", // Center the background image
          }}
        ></div>
      </div>
    </div>
  );
}
