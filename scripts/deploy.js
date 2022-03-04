"use strict"
const { ethers } = require("hardhat")
const { readJsonData } = require("./misc")
const { MerkleTree } = require("./merkle-tree")

async function deployToken(totalSupply) {
    // deploy Token contract
    console.log("Deploying token contract...")

    const [owner] = await ethers.getSigners()
    const Token = await ethers.getContractFactory("TestTokenWithNameAndSymbol")
    const token = await Token.deploy(totalSupply, "TestToken", "TST")
    await token.deployed()

    console.log(`Token deployed at ${token.address}`)
    console.log(`Token supply: ${await token.totalSupply()} ${await token.symbol()}\n`)

    return token
}

async function deployDistributor(token, root) {
    // deploy Distributor contract
    console.log("Deploying distributor contract...")

    const [owner] = await ethers.getSigners()
    const Distributor = await ethers.getContractFactory("SimpleRewardDistributor")
    const distributor = await Distributor.deploy(token.address, root)
    await distributor.deployed()

    console.log(`Distributor deployed at ${distributor.address}\n`)

    return distributor
}

async function transferTokens(token, distributor, amount) {
    // transfer tokens to distributor supply
    console.log(`Transfering ${amount} tokens to distributor...`)

    const [owner] = await ethers.getSigners()
    const tx = await token.transfer(distributor.address, amount)
    const receipt = await tx.wait(1)
    const balance = await token.balanceOf(distributor.address)

    console.log(`Balance of the distributor: ${balance} ${await token.symbol()}\n`)

    return receipt
}

async function claimFrom(distributor, index, account, amount, proof) {
    // claim tokens to account
    console.log(`Claiming ${amount} from: ${account} (index: ${index})...`)
    let receipt = null
    try {
        const tx = await distributor.claim(index, account, amount, proof)
        receipt = await tx.wait(1)
    } catch (err) {
        console.log("Claim failed!")
        // console.log(err)
    }
    const isClaimed = await distributor.isClaimed(index)
    console.log(`Drop claimed: ${isClaimed}\n`)
    return receipt
}

async function checkClaim(distributor, index, account, amount, proof) {
    // check if claim is valid
    console.log(`Checking validity of claim for ${account} (index: ${index})...`)
    let claim = false
    try {
        claim = await distributor.checkClaim(index, account, amount, proof)
    } catch (err) {
        console.log("Cheking failed!")
        // console.log(err)
    }
    console.log(`Claim valid: ${claim}\n`)
    return claim
}

async function main() {
    // initial deploy
    console.log(`Building Merkle tree...`)
    const data = readJsonData("rewardDistribution2")
    const tree = new MerkleTree(data, 2)
    const root = tree.merkleRoot

    console.log(`Merkle root: ${root}\n`)

    const supply = ethers.utils.parseUnits("10000000", "ether")
    const token = await deployToken(supply)

    const distributor = await deployDistributor(token, root)
    const rc = await transferTokens(token, distributor, supply)

    // test claim

    // let index, account, amount, targetNode, proof, claim, value
    // value = data[0];
    // [index, account, amount] = value
    // targetNode = tree.initialNodes[value]
    // proof = tree.getProof(targetNode)
    // claim = await claimFrom(distributor, index, account, ethers.BigNumber.from(`${amount}`), proof)

}

if (!module.parent) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error)
            process.exit(1)
        })
}

module.exports = {
    checkClaim
}