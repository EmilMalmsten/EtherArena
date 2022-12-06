import useEth from "../../contexts/EthContext/useEth";

function JoinRound({ selectedFighter, currentRound, setLoader, loader }) {
  const { state: { contract, accounts } } = useEth();
  
  const join = async () => {
    if (Object.keys(selectedFighter).length > 0) {
      await contract.methods.joinRound(selectedFighter.id).send({ from: accounts[0] })
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
    } else {
      console.error("Select or Mint a fighter be able to upgrade");
    }
  }

  return (
    <div className="btns">
      <button disabled={loader} onClick={join} style={{display: selectedFighter.round < currentRound && selectedFighter.round > 0 ? 'flex' : 'none' }}>
        Join Round
      </button>
    </div>
  );
}

export default JoinRound;
