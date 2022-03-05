"use strict"
const { expect } = require("chai")
const { ethers } = require("hardhat")
const { readJsonData } = require("../scripts/misc")
const { checkClaim } = require("../scripts/deploy")
const { MerkleTree } = require("../scripts/merkle-tree")

const DISTRIBUTOR_ADDRESS = "0x4002a62CC0faB1c46c15963703Aa9e5c32c6A2F5"

describe("Distributor test claims", async () => {

    const data = readJsonData("rewardDistribution2")
    const tree = new MerkleTree(data, 2)

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