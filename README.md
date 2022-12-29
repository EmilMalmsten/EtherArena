# Ether Arena

Mint a NFT fighter to enter the arena.
All fighters are locked and can not be transferred.

Fighters can be upgraded once every 24 hours to increase their power level.

The first fighter to reach a power level over 9000 wins the current fighting round and gets released from the arena. (Which means that the token can now be transferred)

Losing fighters remain locked.

Built with Truffle, Web3.js and React


## FAQ

- __How does the upgrade function work?__

  The amount of power level gained is randomly generated by Chainlink VRF (Verifiable random function)  [read more about chainlink vrf here](https://chain.link/vrf).

- __Which networks is this game available on?__

  The game is currently only deployed to the Ethereum Goerli testnet.
