import { useState, useEffect, useCallback, useRef } from "react";
import useEth from "../../contexts/EthContext/useEth";
import NoticeNoArtifact from "./NoticeNoArtifact";
import NoticeWrongNetwork from "./NoticeWrongNetwork";
import MintFighter from "./MintFighter";
import DisplayFighter from "./DisplayFighter";
import UpgradeFighter from "./UpgradeFighter";
import JoinRound from "./JoinRound";
import DisplayInventory from "./DisplayInventory";
import Leaderboard from "./Leaderboard";
import WinsLeaderboard from "./WinsLeaderboard";
import Loader from "./Loader";

function Game() {
  const { state: { contract, accounts, artifact } } = useEth();
  const [ loader, setLoader ] = useState("");
  const [ currentRound, setCurrentRound ] = useState("");
  const [ selectedFighter, setSelectedFighter ] = useState({});
  const [ fighterInventory, setFighterInventory ] = useState([]);
  const [ updateLeaderboard, setUpdateLeaderboard ] = useState(0);
  const [ updateWinsLeaderboard, setUpdateWinsLeaderboard ] = useState(0);
  const lastSelectedFighter = useRef();
  const upgradeTokenId = useRef();

  // Callback function for when a fighter is selected in DisplayInventory
  const setFighter = (fighterIndex) => {
    setSelectedFighter(fighterInventory[fighterIndex]);
    lastSelectedFighter.current = fighterIndex;
  }
  
  // Callback function for when a fighter is upgraded in the UpgradeFighter component to keep track of which token was upgraded
  const setUpgradeTokenId = (tokenId) => {
    upgradeTokenId.current = tokenId;
  }

  // Reload fighter inventory from contract
  const loadGame = useCallback(
    async (contract, accounts) => {
      console.log("Loading game state");
      setLoader("Loading game");
      let fighters = [];
      const fighterBalance = await contract.methods.balanceOf(accounts[0]).call();
      if(fighterBalance > 0) {
        for (let i = 0; i < fighterBalance; i++) {
          const tokenId = await contract.methods.tokenOfOwnerByIndex(accounts[0], i).call();
          const ipfsURL = await contract.methods.tokenURI(tokenId).call();
          const fighterStatus = await contract.methods.fighters(tokenId).call();
          const request = new Request(ipfsURL);
          const response = await fetch(request);
          const fighter = await response.json();
          fighter.id = tokenId;
          fighter.powerLevel = fighterStatus.powerLevel;
          fighter.round = Number(fighterStatus.round);
          fighter.nextUpgrade = fighterStatus.nextUpgrade;
          fighters.push(fighter);
        }
      }
      setFighterInventory(fighters);
      // Check if there was a fighter selected prior to render and set that one as selected again
      if (Number.isInteger(lastSelectedFighter.current)) {
        setSelectedFighter(fighters[lastSelectedFighter.current]);
      }
      const round = await contract.methods.currentRound().call();
      setCurrentRound(Number(round));
      setLoader("");
      
  }, []);


  // Updates game based on contract events
  useEffect(() => {
    if (contract && accounts){
      const trackedEvents = ["FighterMinted", "FighterJoinedRound", "FighterUpgraded", "FightWon"];
      const eventListener = contract.events.allEvents()
        .on("connected", (id) => {
          console.log(id);
        })
        .on("data", (event) => { 
          // Check if the incoming event is one of the ones I want to track
          if (trackedEvents.includes(event.event)){
            // FigherUpgraded events needs to be dealed with separately since the sender address will be chainlink VRF rather than users address
            if (event.event === "FighterUpgraded") {
              // Reload the game UI and leaderboard if upgraded token is owned by current user
              if (Number(upgradeTokenId.current) === Number(event.returnValues.tokenId)) {
                loadGame(contract, accounts);
                setUpdateLeaderboard((updateLeaderboard) => updateLeaderboard + 1);
              } else {
                // Only update leaderboard
                setUpdateLeaderboard((updateLeaderboard) => updateLeaderboard + 1);
              }
            } else if (event.event === "FightWon") {
              loadGame(contract, accounts);
              setUpdateWinsLeaderboard((updateWinsLeaderboard) => updateWinsLeaderboard + 1);
              
            } else if (event.returnValues.sender === accounts[0]) {
              loadGame(contract, accounts);
            }
          }
        })
        .on("error", (error) => {
          console.error(error);
        });
      return () => {
        eventListener.off("connected").off("data").off("error");
      }
    }
  }, [contract, accounts, loadGame]);
  
  // Loads game on first render
  useEffect(() => {
    if (contract && accounts){
      loadGame(contract, accounts);
    }
  }, [accounts, contract, loadGame]);

  const game =
    <>
      { loader.length > 0 ? <Loader loader={loader} /> : null }
      <div>Current fighting round: {currentRound}</div>
      <DisplayFighter selectedFighter={selectedFighter} />
      <div className="btnContainer">
        <MintFighter fighterAmount={fighterInventory.length} setLoader={setLoader} loader={loader} />
        <UpgradeFighter selectedFighter={selectedFighter} currentRound={currentRound} setLoader={setLoader} loader={loader} setUpgradeTokenId={setUpgradeTokenId} />
        <JoinRound selectedFighter={selectedFighter} currentRound={currentRound} setLoader={setLoader} loader={loader} />
      </div>
      <DisplayInventory fighterInventory={fighterInventory} setFighter={setFighter} />
      <h3>Leaderboard</h3>
      <div className="leaderboardContainer">
        <Leaderboard currentRound={currentRound} updateLeaderboard={updateLeaderboard} />
        <WinsLeaderboard updateWinsLeaderboard={updateWinsLeaderboard} />
      </div>
    </>;

  return (
    <div className="gameContainer">
      {
        !artifact ? <NoticeNoArtifact /> :
          !contract ? <NoticeWrongNetwork /> :
            game
      }
    </div>
  );
}

export default Game;
