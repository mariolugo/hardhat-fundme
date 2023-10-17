import { ethers, deployments, getNamedAccounts, network } from "hardhat";
import { assert } from "chai";
import { developmentChains } from "../../helper-hardhat-config";

developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe", async function () {
      let fundMe: any;
      const sendValue = ethers.parseEther("1.0");
      beforeEach("", async function () {
        const deployer = (await getNamedAccounts()).deployer;
        console.log({ deployer });
        const fundMeContract = await ethers.getContractFactory("FundMe");
        fundMe = await fundMeContract.attach(
          "0x0aE14e79c4A2d7A5652aa3B7b2102ad5e0E6a966"
        );

        // fundMe = await ethers.getContractAt(
        //   fundMeContract.abi,
        //   fundMeContract.address,
        //   signers[0]
        // );
      });

      it("allows people to fund and withdraw", async function () {
        const fundTxResponse = await fundMe.fund({ value: sendValue });
        console.log("fund tx response: ", fundTxResponse);
        await fundTxResponse.wait(1);
        console.log("wait fund tx ");
        const withdrawTxResponse = await fundMe.withdraw();
        console.log("withdraw tx response: ", withdrawTxResponse);
        await withdrawTxResponse.wait(1);
        console.log("wait withdraw tx ");

        const endingFundMeBalance = await ethers.provider.getBalance(
          await fundMe.getAddress()
        );
        console.log(
          endingFundMeBalance.toString() +
            " should equal 0, running assert equal..."
        );
        assert.equal(endingFundMeBalance.toString(), "0");
      });
    });
