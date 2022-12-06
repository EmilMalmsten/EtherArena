import useEth from "../../contexts/EthContext/useEth";

function UpgradeFighter({ currentRound, selectedFighter, setLoader, loader, setUpgradeTokenId }) {
  const { state: { contract, accounts } } = useEth();

  const upgrade = async () => {
    if (Object.keys(selectedFighter).length > 0) {
      const tokenId = selectedFighter.id;
      await contract.methods.upgradeFighter(tokenId).send({ from: accounts[0] })
        .on("transactionHash", () => {
          setLoader("Waiting for confirmation from Ethereum");
          setUpgradeTokenId(tokenId);
        })
        .on("receipt", () => {
          setLoader("Confirmed! Fighter is being upgraded, this can take a few minutes.");
        })
        .on("error", (error) => {
          console.error(error);
          setLoader("");
        });
    }
  }

  function disable() {
    const msToNextUpgrade = selectedFighter.nextUpgrade * 1000 - Date.now();
    if (loader || msToNextUpgrade > 0) {
      return true;
    } else {
      return false;
    }
  }

  return (
    <div className="btns">
      <button onClick={upgrade} disabled={disable()} style={{display: selectedFighter.round === currentRound ? 'flex' : 'none' }}>
        Upgrade Fighter
      </button>
    </div>
  );
}

export default UpgradeFighter;
