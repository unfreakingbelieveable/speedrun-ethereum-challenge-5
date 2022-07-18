const { ethers } = require("hardhat");
const { use, expect } = require("chai");
const { solidity } = require("ethereum-waffle");
const { members } = require("../hardhat-helper-config");

use(solidity);

// FYI - This is the WETH addr on mainnet
const notMember = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

describe("My Dapp", function () {
  let myContract;
  let member;

  // quick fix to let gas reporter fetch data from gas station & coinmarketcap
  before((done) => {
    setTimeout(done, 2000);
  });

  describe("Multisig", function () {
    it("Should deploy Multisig", async function () {
      const Multisig = await ethers.getContractFactory("Multisig");

      member = (await ethers.getSigners())[1];
      members.push(member.address.toString());

      // imported members PLUS the second signer address
      myContract = await Multisig.deploy(members);
    });

    describe("Constructor()", function () {
      it("Should have saved signers to array properly", async function () {
        let i;
        for (i = 0; i < members.length; i++) {
          expect(await myContract.s_signers(i)).to.equal(members[i]);
        }

        // Ensure there's no extra members added
        i += 1;
        await expect(myContract.s_signers(i)).to.be.reverted;
      });

      it("Should have updated signers mapping properly", async () => {
        members.forEach(async (member) => {
          expect(await myContract.s_isSigner(member)).to.equal(true);
        });

        expect(await myContract.s_isSigner(notMember)).to.equal(false);
      });
    });

    describe("AddSigner()", () => {
      it("Non-signer cannot add signer to contract", async () => {
        await expect(myContract.addSigner(notMember)).to.be.reverted;
      });

      it("Signer can add signer to contract", async () => {
        const tempContract = await myContract.connect(member);
        await tempContract.addSigner(notMember);
      });
    });
  });
});
