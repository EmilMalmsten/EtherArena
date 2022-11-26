//import { useState } from "react";
import useEth from "../../contexts/EthContext/useEth";

function UpgradeFighter({ fighterRound, currentRound }) {
  const { state: { contract, accounts } } = useEth();

  const upgrade = async () => {
    const tokenId = await contract.methods.addressToTokenId(accounts[0]).call();
    await contract.methods.upgradeFighter(tokenId).send({ from: accounts[0] });
  }

  return (
    <div className="btns">
      <button onClick={upgrade} style={{display: fighterRound === currentRound ? 'flex' : 'flex' }}>
        Upgrade Fighter
      </button>
    </div>
  );
}

export default UpgradeFighter;
