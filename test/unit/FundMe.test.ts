import { ethers, deployments, getNamedAccounts, network } from "hardhat";
import { expect, assert } from "chai";
import { Contract, Signer } from "ethers";
import { developmentChains } from "../../helper-hardhat-config";

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe", async function () {
  let fundMe: any;
  let mockV3Aggregator: any;
  let deployer: any;
  const sendValue = ethers.parseEther("1.0");
  beforeEach("", async function () {
    deployer = (await getNamedAccounts()).deployer;
    const signers = await ethers.getSigners();
    await deployments.fixture(["all"]);
    const fundMeContract = await deployments.get("FundMe");
    const mockV3AggregatorContract = await deployments.get("MockV3Aggregator");

    fundMe = await ethers.getContractAt(
      fundMeContract.abi,
      fundMeContract.address,
      signers[0]
    );
    mockV3Aggregator = await ethers.getContractAt(
      mockV3AggregatorContract.abi,
      mockV3AggregatorContract.address,
      signers[0]
    );
  });

  describe("constructor", async function () {
    it("sets the aggregator addresses correctly", async function () {
      const response = await fundMe.getPriceFeed();
      assert.equal(response, await mockV3Aggregator.getAddress());
    });
  });

  describe("getEntranceFee", async function () {
    it("Fails if you pass in less than 50", async function () {
      await expect(fundMe.fund()).to.be.revertedWith("Didn't send enough!");
    });
    it("updated the amount funded data structure", async function () {
      await fundMe.fund({ value: sendValue });
      const response = await fundMe.getAddressToAmountFunded(deployer);
      assert.equal(response.toString(), sendValue.toString());
    });
    it("Adds funder to  array of funders", async function () {
      await fundMe.fund({ value: sendValue });
      const response = await fundMe.getFunder(0);
      assert.equal(response, deployer);
    });
  });

  describe("Withdraw", async function () {
    beforeEach(async function () {
      await fundMe.fund({ value: sendValue });
    });

    it("withdraw ETH from a single founder", async function () {
      const startingBalance = await ethers.provider.getBalance(
        await fundMe.getAddress()
      );

      const startingDeployerBalance = await ethers.provider.getBalance(
        deployer
      );

      const transactionResponse = await fundMe.withdraw();
      const transactionReceipt = await transactionResponse.wait(1);

      const { gasUsed, gasPrice } = transactionReceipt;

      const gasCost = gasUsed * gasPrice;

      const endingFundMeBalance = await ethers.provider.getBalance(
        await fundMe.getAddress()
      );
      const endingDeployerBalance = await ethers.provider.getBalance(deployer);

      assert.equal(endingFundMeBalance, 0n);
      assert.equal(
        startingBalance + startingDeployerBalance,
        endingDeployerBalance + BigInt(gasCost)
      );
    });
    it("allows us to withdraw with multiple funders", async function () {
      const accounts = await ethers.getSigners();

      for (let i = 1; i < 6; i++) {
        const fundMeConnectedContract = await fundMe.connect(accounts[i]);
        await fundMeConnectedContract.fund({ value: sendValue });
      }

      const startingBalance = await ethers.provider.getBalance(
        await fundMe.getAddress()
      );

      const startingDeployerBalance = await ethers.provider.getBalance(
        deployer
      );

      const transactionResponse = await fundMe.withdraw();
      const transactionReceipt = await transactionResponse.wait(1);

      const { gasUsed, gasPrice } = transactionReceipt;

      const gasCost = gasUsed * gasPrice;

      const endingFundMeBalance = await ethers.provider.getBalance(
        await fundMe.getAddress()
      );
      const endingDeployerBalance = await ethers.provider.getBalance(deployer);

      assert.equal(endingFundMeBalance, 0n);
      assert.equal(
        startingBalance + startingDeployerBalance,
        endingDeployerBalance + BigInt(gasCost)
      );

      await expect(fundMe.getFunder(0)).to.be.reverted;

      for (let i = 1; i < 6; i++) {
        assert.equal(
          await fundMe.getAddressToAmountFunded(accounts[i].address),
          0n
        );
      }
    });
  });
  it("only allows the owner to withdraw", async function () {
    const accounts: Signer[] = await ethers.getSigners();
    const attacker = accounts[1];
    const attackerConnectedContract = await fundMe.connect(attacker);
    // await expect(attackerConnectedContract.withdraw()).to.be.revertedWith(
    //   "FundMe__NotOwner()"
    // );
    // await attackerConnectedContract.withdraw();
    await expect(
      attackerConnectedContract.withdraw()
    ).to.be.revertedWithCustomError(
      attackerConnectedContract,
      "FundMe__NotOwner"
    );
  });
  it("allows us to cheapWithdraw with multiple funders", async function () {
    const accounts = await ethers.getSigners();

    for (let i = 1; i < 6; i++) {
      const fundMeConnectedContract = await fundMe.connect(accounts[i]);
      await fundMeConnectedContract.fund({ value: sendValue });
    }

    const startingBalance = await ethers.provider.getBalance(
      await fundMe.getAddress()
    );

    const startingDeployerBalance = await ethers.provider.getBalance(deployer);

    const transactionResponse = await fundMe.cheapWithdraw();
    const transactionReceipt = await transactionResponse.wait(1);

    const { gasUsed, gasPrice } = transactionReceipt;

    const gasCost = gasUsed * gasPrice;

    const endingFundMeBalance = await ethers.provider.getBalance(
      await fundMe.getAddress()
    );
    const endingDeployerBalance = await ethers.provider.getBalance(deployer);

    assert.equal(endingFundMeBalance, 0n);
    assert.equal(
      startingBalance + startingDeployerBalance,
      endingDeployerBalance + BigInt(gasCost)
    );

    await expect(fundMe.getFunder(0)).to.be.reverted;

    for (let i = 1; i < 6; i++) {
      assert.equal(
        await fundMe.getAddressToAmountFunded(accounts[i].address),
        0n
      );
    }
  });
});
