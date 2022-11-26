//import { useState } from "react";
import useEth from "../../contexts/EthContext/useEth";

function JoinRound({ tokenId, fighterRound, currentRound }) {
  const { state: { contract, accounts } } = useEth();
  
  const join = async () => {
    await contract.methods.joinRound(tokenId).send({ from: accounts[0] });
  }

  return (
    <div className="btns">
      <button onClick={join} style={{display: fighterRound < currentRound && fighterRound > 0 ? 'flex' : 'none' }}>
        Join Round
      </button>
    </div>
  );
}

export default JoinRound;
