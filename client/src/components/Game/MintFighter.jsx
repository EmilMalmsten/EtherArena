//import { useState } from "react";
import useEth from "../../contexts/EthContext/useEth";

function MintFighter({ tokenId }) {
  const { state: { contract, accounts } } = useEth();

  const mint = async () => {
    await contract.methods.safeMint().send({ from: accounts[0] });
  }

  return (
    <div className="btns">
      <button onClick={mint} style={{display: tokenId < 1 ? 'flex' : 'flex' }}>
        Mint Fighter
      </button>
    </div>
  );
}

export default MintFighter;
