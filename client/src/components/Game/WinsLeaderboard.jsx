import { useEffect, useState } from "react";
import useEth from "../../contexts/EthContext/useEth";

function WinsLeaderboard({ updateWinsLeaderboard }) {
  const { state: { contract } } = useEth();
  const [ winsLeaderboard, setWinsLeaderboard ] = useState([]);

  useEffect(() => {
  if (contract) {
    const getEvents = async () => {
      await contract.getPastEvents("FightWon", { fromBlock: 1}).then((events) => {

        const winningTokenIds = events.map((event) => {
          return Number(event.returnValues.tokenId);
        });

        // Check amount of wins per token
        const winsPerTokenId  = winningTokenIds.reduce(function(a, b){
          a[b] = a[b] + 1 || 1
          return a;
        }, {});

        let sortable = [];
        for (const id in winsPerTokenId) {
            sortable.push([id, winsPerTokenId[id]]);
        }

        sortable.sort(function(a, b) {
            return b[1] - a[1];
        }).slice(0,9);

        setWinsLeaderboard(sortable);

      });
    };
    getEvents();
  }
  }, [contract, updateWinsLeaderboard ]);

  
  return (
    <div>
      <h4>Most fights won</h4>
      <ol>
        {winsLeaderboard.map(fighter => {
          return (
            <li key={fighter[0]}>Token ID: {fighter[0]} - Total wins: {fighter[1]}</li>
          )
        })}
      </ol>
    </div>
  );
}

export default WinsLeaderboard;
