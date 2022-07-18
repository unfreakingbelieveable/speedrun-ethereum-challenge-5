const { ethers } = require("hardhat");
const { use, expect } = require("chai");
const { solidity } = require("ethereum-waffle");
const { members } = require("../hardhat-helper-config");

use(solidity);

// FYI - This is the WETH addr on mainnet
const notMember = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

describe("My Dapp", function () {
  let myContract;
  let signerContract;
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
        await expect(myContract.addSigner(notMember)).to.be.revertedWith(
          "Multisig__UserIsNotSigner"
        );
      });

      it("Existing signer can add new signer to contract", async () => {
        signerContract = await myContract.connect(member);

        await expect(signerContract.addSigner(notMember))
          .to.emit(signerContract, "SignerAdded")
          .withArgs(notMember);

        expect(await signerContract.s_isSigner(notMember)).to.equal(true);

        expect(await signerContract.s_signers(3)).to.equal(notMember);
      });

      it("Should fail adding existing signer", async () => {
        await expect(signerContract.addSigner(notMember)).to.be.revertedWith(
          "Multisig__UserAlreadySigner"
        );
      });
    });

    describe("findIndexOfSigner()", () => {
      it("Finds correct index of signer in signer's array", async () => {
        expect(await myContract.findIndexOfSigner(members[0])).to.equal(0);
        expect(await myContract.findIndexOfSigner(members[1])).to.equal(1);
        expect(await myContract.findIndexOfSigner(members[2])).to.equal(2);
      });
    });

    describe("removeFromSignersArray()", () => {
      it("Removes correct index in signer's array", async () => {
        let lastSigner = await signerContract.s_signers(3);
        await signerContract.removeFromSignersArray(0);
        let newFirstSigner = await signerContract.s_signers(0);

        expect(newFirstSigner).to.be.equal(lastSigner);
      });
    });

    describe("removeSigner()", () => {
      it("Non-signer cannot remove signer from contract", async () => {
        await expect(myContract.removeSigner(notMember)).to.be.revertedWith(
          "Multisig__UserIsNotSigner"
        );
      });

      it("Existing signer can remove signer from contract", async () => {
        await expect(signerContract.removeSigner(notMember))
          .to.emit(signerContract, "SignerRemoved")
          .withArgs(notMember);

        expect(await signerContract.s_isSigner(notMember)).to.equal(false);

        let temp = await signerContract.getSigners();
        console.log(temp);
        // members.forEach(async (member) => {
        //   expect(await signerContract.s_isSigner(member)).to.equal(true);
        //   let temp = await signerContract.findIndexOfSigner(member);
        //   console.log(`Member: ${member}, Index: ${temp}`);
        // });
        // expect(await signerContract.s_signers(2)).to.equal(member);

        // Ensure the array got resized
        await expect(signerContract.s_signers(2)).to.be.reverted;
      });

      // it("Should fail adding existing signer", async () => {
      //   await expect(signerContract.addSigner(notMember)).to.be.revertedWith(
      //     "Multisig__UserAlreadySigner"
      //   );
      // });
    });
  });
});
