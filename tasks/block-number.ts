import { task } from "hardhat/config";

task("block-number", "Prints the current block number").setAction(
  async (_, { ethers }) => {
    const blockNumber = await ethers.provider.getBlockNumber();
    console.log(`Current block number: ${blockNumber}`);
  }
);
