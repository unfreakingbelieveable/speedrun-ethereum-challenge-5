const { ethers } = require("hardhat");
const { use, expect } = require("chai");
const { solidity } = require("ethereum-waffle");
const { members } = require("../hardhat-helper-config");

use(solidity);

// FYI - This is the WETH addr on mainnet
const notMember = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const initialTimeout = 60 * 60 * 24 * 7; // One week in seconds

describe("My Dapp", function () {
  let myContract;
  let signerContract;
  let member;

  // quick fix to let gas reporter fetch data from gas station & coinmarketcap
  before((done) => {
    setTimeout(done, 2000);
  });

  describe("Multisig", function () {
    it("Should deploy Multisig", async () => {
      const Multisig = await ethers.getContractFactory("Test_Multisig");

      member = (await ethers.getSigners())[1];
      members.push(member.address.toString());

      // imported members PLUS the second signer address
      myContract = await Multisig.deploy(members, initialTimeout);

      signerContract = myContract.connect(member);
    });

    describe("Constructor()", () => {
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

      it("Should have saved timeout properly", async () => {
        expect((await myContract.s_expirationTimeout()).toString()).to.equal(
          initialTimeout.toString()
        );
      });
    });

    describe("changeTimeout()", () => {
      it("Does not allow non-signer to change timeout", async () => {
        await expect(myContract.changeTimeout(420)).to.be.revertedWith(
          "Multisig__UserIsNotSigner"
        );
      });

      it("Changes timeout in contract", async () => {
        let newTimeout = 30; // 30 seconds
        await signerContract.changeTimeout(newTimeout);

        expect(await signerContract.s_expirationTimeout()).to.equal(newTimeout);

        expect(await signerContract.changeTimeout(newTimeout))
          .to.emit(signerContract, "TimeoutChanged")
          .withArgs(newTimeout.toString());
      });
    });

    describe("AddSigner()", () => {
      it("Non-signer cannot add signer to contract", async () => {
        await expect(myContract.addSigner(notMember)).to.be.revertedWith(
          "Multisig__UserIsNotSigner"
        );
      });

      it("Existing signer can add new signer to contract", async () => {
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
        expect(await myContract.test_findIndexOfSigner(members[0])).to.equal(0);
        expect(await myContract.test_findIndexOfSigner(members[1])).to.equal(1);
        expect(await myContract.test_findIndexOfSigner(members[2])).to.equal(2);
      });
    });

    describe("removeFromSignersArray()", () => {
      it("Removes correct index in signer's array", async () => {
        await signerContract.test_removeFromSignersArray(3, notMember);

        for (let i = 0; i < members.length; i++) {
          expect(await signerContract.s_signers(i)).to.equal(members[i]);
        }

        // Undo this test for later tests
        await signerContract.addSigner(notMember);
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

        expect((await signerContract.test_getSigners()).toString()).to.equal(
          members.toString()
        );
      });

      it("Should fail adding existing signer", async () => {
        await expect(
          signerContract.addSigner(member.address)
        ).to.be.revertedWith("Multisig__UserAlreadySigner");
      });
    });

    describe("submitProposal()", () => {
      let target = notMember; // WETH address
      let value = ethers.utils.parseEther("0.1");
      let funcName = "deposit()";
      let data = ethers.utils.toUtf8Bytes("");
      let description = "From submitProposal() tests";

      it("Does not allow non-signer to submit proposal", async () => {
        await expect(
          myContract.submitProposal(target, value, funcName, data, description)
        ).to.be.revertedWith("Multisig__UserIsNotSigner");
      });

      it("Submits proposal", async () => {
        for (let i = 0; i < 2; i++) {
          expect(
            await signerContract.submitProposal(
              target,
              value,
              funcName,
              data,
              description
            )
          )
            .to.emit(signerContract, "ProposalAdded")
            .withArgs(member.address, description, Number);

          let proposal = await signerContract.s_proposals(i);
          expect(proposal.from).to.equal(member.address);
          expect(proposal.target).to.equal(target);
          expect(proposal.value).to.equal(value);
          expect(proposal.func).to.equal(funcName);
          expect(proposal.data).to.equal("0x");
          expect(proposal.description).to.equal(description);
          expect(proposal.executed).to.equal(false);

          // TODO: Test expiration

          let votes = await signerContract.test_getVoteArrayInProposal(i);
          expect(votes.length).to.equal(0);
        }
      });
    });

    describe("voteOnProposal()", () => {
      it("Non-signer cannot vote", async () => {
        await expect(myContract.voteOnProposal(0)).to.be.revertedWith(
          "Multisig__UserIsNotSigner"
        );
      });

      it("Signer can vote on proposal", async () => {
        expect(await signerContract.voteOnProposal(0))
          .to.emit(signerContract, "SignerVoted")
          .withArgs(member.address, 0);

        let votes = await signerContract.test_getVoteArrayInProposal(0);
        expect(votes[0]).to.equal(member.address);
      });
    });
  });
});
