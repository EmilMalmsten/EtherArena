import { useEffect, useState } from "react";
import useEth from "../../contexts/EthContext/useEth";

function Leaderboard({ currentRound, updateLeaderboard }) {
  const { state: { contract } } = useEth();
  const [ leaderboard, setLeaderboard ] = useState([]);
  
  useEffect(() => {
  if (contract && currentRound > 0) {
    const getEvents = async () => {

      await contract.getPastEvents("FighterUpgraded", { fromBlock: 1}).then((events) => {

        const fighters = events.filter((event) => {
          if (Number(event.returnValues.round) === currentRound) {
            return event;
          } else {
            return null;
          }
        }).map((e) => {
          return {
            id: e.returnValues.tokenId,
            powerLevel: Number(e.returnValues.powerLevel)
          }; 
        });

        // Only keep the highest power level for each id
        const uniqueFighters = Object.values(fighters.reduce((r, o) => {
          r[o.id] = (r[o.id] && r[o.id].powerLevel > o.powerLevel) ? r[o.id] : o

          return r
        }, {}))
        
        const uniqueFightersSorted = uniqueFighters.sort((a, b) => b.powerLevel - a.powerLevel).slice(0,9);
        setLeaderboard(uniqueFightersSorted);

      });
    };
    getEvents();
  }
  }, [contract, currentRound, updateLeaderboard ]);

  return (
    <div>
      <h4>Current fighting round</h4>
      <ol>
        {leaderboard.map((fighter) => {
          return (
            <li key={fighter.id} >Fighter ID: {fighter.id} - Power Level: {fighter.powerLevel}</li>
          )
        })}
      </ol>
    </div>
  );
}

export default Leaderboard;
