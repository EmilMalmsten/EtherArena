function Loader({ loader }) {
  return (
      <div className="loadingContainer">
        <p>{loader}</p>
        <div className="dotContainer">
          <div className="dot-flashing"></div>
        </div>
      </div>
  );
}

export default Loader;
