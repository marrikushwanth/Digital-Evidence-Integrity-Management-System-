import hre from "hardhat";

async function main() {
  const DEIMSEvidence = await hre.ethers.getContractFactory("DEIMSEvidence");
  const deimsEvidence = await DEIMSEvidence.deploy();

  await deimsEvidence.waitForDeployment();
  const address = await deimsEvidence.getAddress();

  console.log(`DEIMSEvidence contract deployed to: ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
