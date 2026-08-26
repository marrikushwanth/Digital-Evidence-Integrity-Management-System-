import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

describe("DEIMSEvidence", function () {
  let deimsEvidence;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const DEIMSEvidence = await ethers.getContractFactory("DEIMSEvidence");
    deimsEvidence = await DEIMSEvidence.deploy();
    await deimsEvidence.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await deimsEvidence.owner()).to.equal(owner.address);
    });
  });

  describe("Evidence Registration", function () {
    it("Should allow owner to register evidence", async function () {
      await expect(deimsEvidence.registerEvidence("EVID1", "CASE1", "HASH1", "USER1"))
        .to.emit(deimsEvidence, "EvidenceRegistered");
        
      expect(await deimsEvidence.evidenceExists("EVID1")).to.equal(true);
    });

    it("Should prevent non-owner from registering evidence", async function () {
      await expect(
        deimsEvidence.connect(addr1).registerEvidence("EVID2", "CASE1", "HASH2", "USER1")
      ).to.be.revertedWith("Only owner can perform this action");
    });

    it("Should prevent registering duplicate evidence IDs", async function () {
      await deimsEvidence.registerEvidence("EVID3", "CASE1", "HASH3", "USER1");
      await expect(
        deimsEvidence.registerEvidence("EVID3", "CASE1", "HASH3", "USER1")
      ).to.be.revertedWith("Evidence already registered");
    });
  });

  describe("Evidence Verification", function () {
    it("Should return true for correct hash", async function () {
      await deimsEvidence.registerEvidence("EVID4", "CASE1", "HASH4", "USER1");
      
      const tx = await deimsEvidence.verifyEvidence("EVID4", "HASH4");
      await expect(tx)
        .to.emit(deimsEvidence, "EvidenceVerified");
    });

    it("Should return false for incorrect hash", async function () {
      await deimsEvidence.registerEvidence("EVID5", "CASE1", "HASH5", "USER1");
      
      const tx = await deimsEvidence.verifyEvidence("EVID5", "WRONGHASH");
      await expect(tx)
        .to.emit(deimsEvidence, "EvidenceVerified");
    });
  });
});
