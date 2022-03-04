const hre = require("hardhat")
const { ethers } = require("hardhat")

// test verify
async function main(){
    await hre.run("verify:verify", {
        address: "0xa2FFa1Ceb6Ba1B5522b067Dd7d212F0b0b7A53f2",
        constructorArguments: [
            "0x2194eCf39Ae06a7497B65eA62341f225d1c2CDA9",
            "0x9402678b907f11d93ca991769258690836496fc2a9a47832e010f970ce91db40"
        ],
      });
}

main()
