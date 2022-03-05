# Merkle tree in JS for working with Solidity

Using:
- `ganache-cli (Node.js)`
- `hardhat (Node.js)`

Same project for [Merkle tree](https://github.com/sikvelsigma/Merkle_Tree_Trans) but with hardhat and fixed tree generation.

## Deploy
To deploy contracts on Rinkeby use `npx hardhat run scripts/deploy.js --network rinkeby`. 
Note: one must specify the tree generation method and initial data hashing type for the task. For the test task to generate the tree with the same root as in the provided contract one must use `MerkleTree(data, 0, 1, ["uint256", "address", "uint256"])` as in `test-claims.js`. For the current version of the contract it will be impossible to claim rewards since `claim` function uses different type of initial data encoding than the `checkClaim` one.

To test claims from existing contract one must specify distributor address in `DISTRIBUTOR_ADDRESS` (currently points to the contract from the task) variable and use `npx hardhat test --network rinkeby`

One also needs to create a `.env` file from `.env.example` with appropriate keys.
## Notes
I've figured out what the problem was. The problem was initial data encoding. I assumed I should use `encodePacked` since it was used in the `claim` function of the contract, but `checkClaim` function uses `encode` which gives different result. So, in the end, I've managed to get both the original hash root and the new one. They both require initial data generation with `encode` and differ in the tree construction. The original hash can be obtained by pushing the odd node into the beginning on the next layer, the new one - by promoting an odd node onto the next layer.

To get the original hash of `0xac1910a665aeb8bd47d75573dfcfe10582a33738b3fe8b12eeba6a884aa86886` one must use `MerkleTree(data, 2, 1, ["uint256", "address", "uint256"])`

To get the new hash of `0x70b2f9fa327eddf705fca65be0b43300dee9c8f1ea76d32203695c863aa4d76b` one must use `MerkleTree(data, 0, 1, ["uint256", "address", "uint256"])`

