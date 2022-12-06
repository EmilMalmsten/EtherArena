//import { useState } from "react";
import useEth from "../../contexts/EthContext/useEth";

function MintFighter({ fighterAmount, setLoader, loader }) {
  const { state: { contract, accounts } } = useEth();

  const mint = async () => {
    await contract.methods.safeMint().send({ from: accounts[0] })
      .on("transactionHash", () => {
        setLoader("Waiting for confirmation from Ethereum");
      })
      .on("receipt", () => {
        setLoader("");
      })
      .on("error", (error) => {
        console.error(error);
        setLoader("");
      });
  }

  return (
    <div className="btns">
      <button disabled={loader} onClick={mint} >
        Mint Fighter
      </button>
    </div>
  );
}

export default MintFighter;
