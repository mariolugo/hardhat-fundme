import { ethers } from "hardhat";
async function main() {
  const fundMe: any = await ethers.getContractAt(
    "FundMe",
    "0x0aE14e79c4A2d7A5652aa3B7b2102ad5e0E6a966"
  );
  console.log("Funding Contract...");
  const transactionResponse = await fundMe.fund({
    value: ethers.parseEther("1.0"),
  });
  await transactionResponse.wait(1)
  console.log("Funded!")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
