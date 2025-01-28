import PokerGame from "./components/PokerGame";
// import { DebugUsePot } from "./components/debug/debugUsePot";
// import { DebugUseDeck } from "./components/debug/DebugUseDeck";

function App() {
  return (
    <div className="bg-black">
      {/* <div className="grayscale-100 opacity-10"> */}
      <PokerGame />
      {/* <DebugUseDeck /> */}
      {/* <DebugUsePot /> */}
      {/* </div> */}
    </div>
  );
}

export default App;
