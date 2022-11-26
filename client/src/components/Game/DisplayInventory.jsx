import { useState, useEffect } from "react";
import useEth from "../../contexts/EthContext/useEth";

function DisplayInventory({ setFighter }) {
  const { state: { contract, accounts } } = useEth();
  const [ fighterInventory, setFighterInventory ] = useState([]);

  useEffect(() => {
    const getInventory = async() => {
      let fighters = [];
      const fighterBalance = await contract.methods.balanceOf(accounts[0]).call();
      if(fighterBalance > 0) {
        for (let i = 0; i < fighterBalance; i++) {
          const tokenId = await contract.methods.tokenOfOwnerByIndex(accounts[0], i).call();
          const ipfsURL = await contract.methods.tokenURI(tokenId).call();
          const request = new Request(ipfsURL);
          const response = await fetch(request);
          const metadata = await response.json();
          metadata.id = tokenId;
          fighters.push(metadata);
        }
      }
      setFighterInventory(fighters);
    };

    getInventory();
  }, [accounts, contract]);

  const selectFighter = async (fighterId) => {
    const fighterStatus = await contract.methods.fighters(fighterId).call();
    const selectedFighter = fighterInventory[fighterId];
    selectedFighter.powerLevel = fighterStatus.powerLevel;
    selectedFighter.round = fighterStatus.round;
    
    setFighter(selectedFighter);
  }

  return (
    <div>
      <h2>My fighters</h2>
      {fighterInventory.map(fighter => {
        return (
          <div key={fighter.id} onClick={() => selectFighter(fighter.id)}>
            <img className="fighterInventory" src={fighter.image} alt="fighter" />
            <p>{fighter.id}</p>
          </div>
        );
      })}
    </div>
  );
}

export default DisplayInventory;
