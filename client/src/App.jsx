import { EthProvider } from "./contexts/EthContext";
import Game from "./components/Game";
import Header from "./components/Header"
import "./App.css";

function App() {
  return (
    <EthProvider>
      <div id="App" >
        <div className="container">
          <Header />
          <Game />
        </div>
      </div>
    </EthProvider>
  );
}

export default App;
