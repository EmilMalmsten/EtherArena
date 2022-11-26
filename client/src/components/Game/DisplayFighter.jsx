function DisplayFighter({ selectedFighter }) {
  return (
    <div>
      {Object.keys(selectedFighter).length === 0 ? null: (
        <>
          <img className="fighter" alt="fighter" src={selectedFighter.image} />
          <p>Power level: {selectedFighter.powerLevel < 9000 ? selectedFighter.powerLevel : "Over 9000"}</p>
          <p>Fighter round: {selectedFighter.round}</p>
          <p>Fighter ID: {selectedFighter.id}</p>
        </>
      )}
    </div>
  );
}
export default DisplayFighter;
