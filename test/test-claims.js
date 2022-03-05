"use strict"
const { expect } = require("chai")
const { ethers } = require("hardhat")
const { readJsonData } = require("../scripts/misc")
const { checkClaim } = require("../scripts/deploy")
const { MerkleTree } = require("../scripts/merkle-tree")

const DISTRIBUTOR_ADDRESS = "0xdd819adf2246c4369fba7934f06db7c741aff10c"

describe("Test hash root",  () => {
    // test root if root is equal to the one in the contracts (old and new)
    const data = readJsonData("rewardDistribution2") 

    let tree

    it('Should equal to the old hash', async () => {
        tree = new MerkleTree(data, 2, 1, ["uint256", "address", "uint256"])
        expect(tree.merkleRoot).to.equal("0xac1910a665aeb8bd47d75573dfcfe10582a33738b3fe8b12eeba6a884aa86886")
    })

    it('Should equal to the new hash', async () => {
        tree = new MerkleTree(data, 0, 1, ["uint256", "address", "uint256"])
        expect(tree.merkleRoot).to.equal("0x70b2f9fa327eddf705fca65be0b43300dee9c8f1ea76d32203695c863aa4d76b")
    })

})


describe("Distributor test claims", () => {
    // test claims from the contract in the task
    const data = readJsonData("rewardDistribution2")
    const tree = new MerkleTree(data, 0, 1, ["uint256", "address", "uint256"])

    let index, account, amount, targetNode, proof, claim, distributor

    beforeEach(async () => {
        distributor = await ethers.getContractAt("SimpleRewardDistributor", DISTRIBUTOR_ADDRESS)
    })

    data.forEach((value) => {
        it('Should test if claim is valid', async () => {
            [index, account, amount] = value
            targetNode = tree.initialNodes[value]
            proof = tree.getProof(targetNode)
            claim = await checkClaim(distributor, index, account, ethers.BigNumber.from(`${amount}`), proof);
            expect(claim).to.equal(true)
        })
    })
})

