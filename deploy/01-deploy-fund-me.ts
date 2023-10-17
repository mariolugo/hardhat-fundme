import { network } from "hardhat";
import { networkConfig, developmentChains } from "../helper-hardhat-config";
import { verify } from "../utils/verify";
import "dotenv/config";

module.exports = async ({ getNamedAccounts, deployments }: any) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  if (chainId) {
    let ethUsdPriceFeedAddress: unknown;
    if (chainId == 31337) {
      const ethUsdAggregator = await deployments.get("MockV3Aggregator");
      ethUsdPriceFeedAddress = ethUsdAggregator.address;
    } else {
      ethUsdPriceFeedAddress = (networkConfig as any)[chainId][
        "ethUsdPriceFeed"
      ];
    }
    log("----------------------------------------------------");
    log("Deploying FundMe and waiting for confirmations...");
    const fundMe = await deploy("FundMe", {
      from: deployer,
      args: [ethUsdPriceFeedAddress],
      log: true,
      // we need to wait if on a live network so we can verify properly
      waitConfirmations: chainId == 31337 ? 1 : 6,
    });
    log(`FundMe deployed at ${fundMe.address}`);

    if (
      !developmentChains.includes(network.name) &&
      process.env.ETHERSCAN_API_KEY
    ) {
      await verify(fundMe.address, [ethUsdPriceFeedAddress]);
    }
  }
};

module.exports.tags = ["all", "fundme"];
