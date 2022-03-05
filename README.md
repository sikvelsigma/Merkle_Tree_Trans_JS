# Merkle tree in JS for working with Solidity

Currently work-in-progress

Using:
- `ganache-cli (Node.js)`
- `hardhat (Node.js)`

Same project for [Merkle tree](https://github.com/sikvelsigma/Merkle_Tree_Trans) but with hardhat

## Deploy
To deploy contracts on Rinkeby use `npx hardhat run scripts/deploy.js --network rinkeby`

To test claims from existing contract one must specify distributor address in `DISTRIBUTOR_ADDRESS` variable and use `npx hardhat test --network rinkeby`

One also needs to create a `.env` file from `.env.example` with appropriate keys.
## Issues
There're the same issues with Merkle root not matching the one specified in the task. Other than that the program has the same functionality as python version.
