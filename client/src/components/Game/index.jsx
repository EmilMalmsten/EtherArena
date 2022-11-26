import { useState, useEffect } from "react";
import useEth from "../../contexts/EthContext/useEth";
import NoticeNoArtifact from "./NoticeNoArtifact";
import NoticeWrongNetwork from "./NoticeWrongNetwork";
import MintFighter from "./MintFighter";
import DisplayFighter from "./DisplayFighter";
import UpgradeFighter from "./UpgradeFighter";
import JoinRound from "./JoinRound";
import DisplayInventory from "./DisplayInventory";

function Game() {
  const { state: { contract, accounts, artifact } } = useEth();
  const [ tokenId, setTokenId ] = useState("");
  const [ selectedFighter, setSelectedFighter ] = useState({});
  const [ currentRound, setCurrentRound ] = useState("");
  const [ fighterRound, setFighterRound ] = useState(0);
  
  const setFighter = (fighter) => {
    setSelectedFighter(fighter);
    setTokenId(fighter.id);
    setFighterRound(fighter.round);
  }

  useEffect(() => {
    const getGameState = async () => {
      try {
        if (contract){
          const round = await contract.methods.currentRound().call();
          setCurrentRound(round);
        }
      } catch (e) {
        console.error(e)
      }
    };
    getGameState();
  }, [accounts, contract]);

  if (contract) {
    contract.events.FightWon()
      .on('data', event => setCurrentRound(event.returnValues.nextRound));
    contract.events.FighterMinted()
      .on('data', event => setTokenId(event.returnValues.tokenId));
  }

  const game =
    <>
      <div>
        <div>Current fighting round: {currentRound}</div>
        <DisplayFighter selectedFighter={selectedFighter} />
        <MintFighter tokenId={tokenId} />
        <UpgradeFighter fighterRound={fighterRound} currentRound={currentRound} />
        <JoinRound tokenId={tokenId} fighterRound={fighterRound} currentRound={currentRound}/>
        <DisplayInventory setFighter={setFighter} />
      </div>
    </>;

  return (
    <div className="demo">
      {
        !artifact ? <NoticeNoArtifact /> :
          !contract ? <NoticeWrongNetwork /> :
            game
      }
    </div>
  );
}

export default Game;
