const EtherArena = artifacts.require("EtherArena");

//Chainlink VRF setup variables
const subscriptionId = "6735";
const keyHash = "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15";
const callbackGasLimit = "100000";

module.exports = function (deployer) {
    deployer.deploy(EtherArena, subscriptionId, keyHash, callbackGasLimit);
};
