function DisplayInventory({ fighterInventory, setFighter }) {
  return (
    <>
      <h2>My fighters</h2>
      <div className="inventoryContainer" >
      {fighterInventory.map((fighter, index) => {
        return (
          <div key={index} onClick={() => setFighter(index)}>
            <img className="inventoryImg" src={fighter.image} alt="fighter" />
            <p>Fighter id: {fighter.id}</p>
            <p>Power level: {fighter.powerLevel < 9000 ? fighter.powerLevel : "Over 9000"}</p>
          </div>
        );
      })}
      </div>
    </>
  );
}

export default DisplayInventory;
