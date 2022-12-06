import { useState, useEffect } from "react";

function DisplayFighter({ selectedFighter }) {
  const [ timeLeft, setTimeLeft ] = useState({});

  const calculateTimeLeft = (difference) => {

    let timeleft = {}

    if (difference > 0) {
      timeleft = {
        h: Math.floor((difference / (1000 * 60 * 60)) % 24),
        m: Math.floor((difference / 1000 / 60) % 60),
        s: Math.floor((difference / 1000) % 60)
      };
    };

    return timeleft;
  };

  useEffect(() => {

    const difference = selectedFighter.nextUpgrade * 1000 - Date.now();
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft(difference));
    }, 1000);

    return () => clearTimeout(timer);
  });

  const timerComponents = [];

  Object.keys(timeLeft).forEach((interval) => {
    if (!timeLeft[interval]) {
      return;
    }

    timerComponents.push(
      <span key={interval}>
        {timeLeft[interval]} {interval}{" "}
      </span>
    );
  });


  return (
    <div>
      {Object.keys(selectedFighter).length === 0 ? null : (
        <>
          <img className="fighter" alt="fighter" src={selectedFighter.image} />
          <p>Power level: {selectedFighter.powerLevel < 9000 ? selectedFighter.powerLevel : "Over 9000"}</p>
          <p>Fighter round: {selectedFighter.round}</p>
          <p>Fighter ID: {selectedFighter.id}</p>
          <p>Upgrade status: {timerComponents.length ? timerComponents : <span>Ready to upgrade</span>}</p>
        </>
      )}
    </div>
  );
}
export default DisplayFighter;
