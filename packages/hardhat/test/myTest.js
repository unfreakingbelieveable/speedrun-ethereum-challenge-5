const { ethers } = require("hardhat");
const { use, expect } = require("chai");
const { solidity } = require("ethereum-waffle");
const { members } = require("../hardhat-helper-config");
const { prop } = require("ramda");

use(solidity);

// FYI - This is the WETH addr on mainnet
const notMember = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const maxProposalsSubmitted = 3;
const minVotes = 1;

describe("My Dapp", function () {
  let myContract;
  let signerContract;
  let messageContract;
  let member;
  let currentTimeout = 5;

  let target;
  let value = 0;
  let funcName = "changeMessage(string)";
  let rawData = "Hi there!";
  let data;
  let description = "From submitProposal() tests";

  // quick fix to let gas reporter fetch data from gas station & coinmarketcap
  before((done) => {
    setTimeout(done, 2000);
  });

  describe("Test_Call", () => {
    describe("Deploy Test_Call", () => {
      it("Deploys Test_Call", async () => {
        const Test_Call = await ethers.getContractFactory("Test_Call");
        messageContract = await Test_Call.deploy();

        target = messageContract.address;

        data = messageContract.interface.encodeFunctionData("changeMessage", [
          rawData,
        ]);
      });
    });
  });

  describe("Multisig", function () {
    it("Should deploy Multisig", async () => {
      const Multisig = await ethers.getContractFactory("Test_Multisig");

      member = (await ethers.getSigners())[1];
      members.push(member.address.toString());

      // imported members PLUS the second signer address
      myContract = await Multisig.deploy(members, currentTimeout, minVotes);

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
          currentTimeout.toString()
        );
      });
    });

    describe("submitProposal()", () => {
      it("Does not allow non-signer to submit proposal", async () => {
        await expect(
          myContract.submitProposal(target, value, funcName, data, description)
        ).to.be.revertedWith("Multisig__UserIsNotSigner");
      });

      it("Submits proposal", async () => {
        for (let i = 0; i < maxProposalsSubmitted; i++) {
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
          expect(proposal.description).to.equal(description);
          expect(proposal.executed).to.equal(false);

          let votes = await signerContract.test_getVoteArrayInProposal(i);
          expect(votes.length).to.equal(0);
        }
      });
    });

    describe("voteOnProposal()", () => {
      it("Non-signer cannot vote", async () => {
        await signerContract.submitProposal(
          target,
          value,
          funcName,
          data,
          description
        );

        let proposalIndex =
          (await signerContract.test_getProposals()).length - 1;

        await expect(
          myContract.voteOnProposal(proposalIndex)
        ).to.be.revertedWith("Multisig__UserIsNotSigner");
      });

      it("Signer can vote on proposal", async () => {
        await signerContract.submitProposal(
          target,
          value,
          funcName,
          data,
          description
        );

        let proposalIndex =
          (await signerContract.test_getProposals()).length - 1;

        expect(await signerContract.voteOnProposal(proposalIndex))
          .to.emit(signerContract, "SignerVoted")
          .withArgs(member.address, proposalIndex);

        let votes = await signerContract.test_getVoteArrayInProposal(
          proposalIndex
        );
        expect(votes[0]).to.equal(member.address);
      });

      it("Cannot vote after proposal expires", async () => {
        await signerContract.submitProposal(
          target,
          value,
          funcName,
          data,
          description
        );

        let proposalIndex =
          (await signerContract.test_getProposals()).length - 1;

        // Wait for proposal voting period to end
        await new Promise((r) => setTimeout(r, (currentTimeout + 1) * 1000));

        await expect(
          signerContract.voteOnProposal(proposalIndex)
        ).to.be.revertedWith("Multisig__ProposalExpired");
      });
    });

    describe("changeTimeout()", () => {
      let newTimeout = 3;

      it("Does not allow EOAs to change timeout", async () => {
        let threwError = false;

        try {
          await signerContract.changeTimeout(420);
        } catch (error) {
          threwError = true;
        }

        expect(threwError).to.equal(true);
      });

      it("Changes timeout in multisig", async () => {
        await signerContract.submitProposal(
          signerContract.address,
          0,
          "changeTimeout(uint256)",
          signerContract.interface.encodeFunctionData("changeTimeout", [
            newTimeout,
          ]),
          "Test to change timeout"
        );

        let allProposals = await signerContract.test_getProposals();

        let proposalIndex = allProposals.length - 1;

        await signerContract.voteOnProposal(proposalIndex);
        await new Promise((r) => setTimeout(r, currentTimeout * 1000));
        await signerContract.executeProposal(proposalIndex);

        expect(await signerContract.s_expirationTimeout()).to.equal(
          newTimeout.toString()
        );

        currentTimeout = newTimeout;
      });
    });

    describe("findIndexOfSigner()", () => {
      it("Finds correct index of signer in signer's array", async () => {
        expect(await myContract.test_findIndexOfSigner(members[0])).to.equal(0);
        expect(await myContract.test_findIndexOfSigner(members[1])).to.equal(1);
      });
    });

    describe("AddSigner()", () => {
      it("Does not allow EOAs to add signer", async () => {
        let threwError = false;

        try {
          await signerContract.addSigner(notMember);
        } catch (error) {
          threwError = true;
        }

        expect(threwError).to.equal(true);
      });

      it("Existing signer can add new signer to contract", async () => {
        await signerContract.submitProposal(
          signerContract.address,
          0,
          "addSigner(address)",
          signerContract.interface.encodeFunctionData("addSigner", [notMember]),
          "Test to add signer"
        );

        let allProposals = await signerContract.test_getProposals();
        let proposalIndex = allProposals.length - 1;

        await signerContract.voteOnProposal(proposalIndex);
        await new Promise((r) => setTimeout(r, currentTimeout * 1000));
        await signerContract.executeProposal(proposalIndex);

        let signersArr = await signerContract.test_getSigners();
        expect(signersArr).to.include(notMember);
        expect(signersArr.length).to.equal(members.length + 1);

        await signerContract.test_removeSigner(notMember);
      });
    });

    describe("removeFromSignersArray()", () => {
      it("Removes correct index in signer's array", async () => {
        // Add member we are going to remove
        await signerContract.test_addToSignersArray(notMember);
        let currSigners = await signerContract.test_getSigners();
        expect(currSigners).to.include(notMember);
        expect(await signerContract.s_isSigner(notMember)).to.equal(true);

        let initalMembers = await signerContract.test_getSigners();
        let memberIndex = await signerContract.test_findIndexOfSigner(
          notMember
        );
        expect(currSigners[memberIndex]).to.equal(notMember);

        await signerContract.test_removeFromSignersArray(
          memberIndex,
          notMember
        );

        currSigners = await signerContract.test_getSigners();

        members.forEach((member) => {
          expect(currSigners).to.include(member);
        });

        expect(currSigners).not.include(notMember);
        expect(currSigners.length).to.equal(initalMembers.length - 1);
      });
    });

    describe("removeSigner()", () => {
      it("Does not allow EOAs to remove signer", async () => {
        let threwError = false;

        try {
          await signerContract.removeSigner(notMember);
        } catch (error) {
          threwError = true;
        }

        expect(threwError).to.equal(true);
      });

      it("Tests removeSigners without multisig", async () => {
        // Add member we are going to remove
        await signerContract.test_addToSignersArray(notMember);
        let currSigners = await signerContract.test_getSigners();
        expect(currSigners).to.include(notMember);
        expect(await signerContract.s_isSigner(notMember)).to.equal(true);

        let initalMembers = await signerContract.test_getSigners();

        await signerContract.test_removeSigner(notMember);

        currSigners = await signerContract.test_getSigners();
        members.forEach((member) => {
          expect(currSigners).to.include(member);
        });

        expect(currSigners).not.include(notMember);
        expect(currSigners.length).to.equal(initalMembers.length - 1);
        expect(await signerContract.s_isSigner(notMember)).to.equal(false);
      });

      it("Tests removeSigners with multisig", async () => {
        // Add member we are going to remove
        await signerContract.test_addToSignersArray(notMember);
        let currSigners = await signerContract.test_getSigners();
        expect(currSigners).to.include(notMember);
        expect(await signerContract.s_isSigner(notMember)).to.equal(true);

        // Setup
        await signerContract.submitProposal(
          signerContract.address,
          0,
          "removeSigner(address)",
          signerContract.interface.encodeFunctionData("removeSigner", [
            notMember,
          ]),
          "Test to remove signer"
        );

        let allProposals = await signerContract.test_getProposals();
        let proposalIndex = allProposals.length - 1;

        let proposal = await signerContract.s_proposals(proposalIndex);

        expect(proposal.target).to.equal(signerContract.address);
        expect(proposal.func).to.equal("removeSigner(address)");
        expect(proposal.data).to.equal(
          signerContract.interface.encodeFunctionData("removeSigner", [
            notMember,
          ])
        );

        await signerContract.voteOnProposal(proposalIndex);
        await new Promise((r) => setTimeout(r, currentTimeout * 1000));
        await signerContract.executeProposal(proposalIndex);

        let signersArr = await signerContract.test_getSigners();
        expect(signersArr).not.include(notMember);
        expect(signersArr.length).to.equal(members.length);
      });
    });

    describe("test_executeProposal()", () => {
      it("Executes a proposal, bypassing multisig", async () => {
        await signerContract.test_executeProposal(
          target,
          value,
          funcName,
          data,
          description
        );

        expect(await messageContract.message()).to.equal(rawData);

        // Reset the message for later tests
        await messageContract.changeMessage("Hello World!");
      });
    });

    describe("executeProposal()", () => {
      it("Does not allow non-signers to execute", async () => {
        expect(myContract.executeProposal(0)).to.be.revertedWith(
          "Multisig__UserIsNotSigner"
        );
      });

      it("Fails to execute a proposal before voting period ends", async () => {
        await signerContract.submitProposal(
          target,
          value,
          funcName,
          data,
          description
        );

        let proposalIndex =
          (await signerContract.test_getProposals()).length - 1;

        await expect(
          signerContract.executeProposal(proposalIndex)
        ).to.be.revertedWith("Multisig__VotingNotEnded");
      });

      it("Tries to execute a proposal without minimum number of votes", async () => {
        await signerContract.submitProposal(
          target,
          value,
          funcName,
          data,
          description
        );

        let proposalIndex =
          (await signerContract.test_getProposals()).length - 1;

        // Wait for proposal voting period to end
        await new Promise((r) => setTimeout(r, currentTimeout * 1000));

        await expect(
          signerContract.executeProposal(proposalIndex)
        ).to.be.revertedWith("Multisig__ProposalDidNotPass");
      });

      it("Executes a proposal via multisig", async () => {
        await signerContract.submitProposal(
          target,
          value,
          funcName,
          data,
          description
        );

        let proposalIndex =
          (await signerContract.test_getProposals()).length - 1;

        await signerContract.voteOnProposal(proposalIndex);
        await new Promise((r) => setTimeout(r, currentTimeout * 1000));

        expect(await signerContract.executeProposal(proposalIndex))
          .to.emit(signerContract, "ProposalExecuted")
          .withArgs(proposalIndex);

        expect(await messageContract.message()).to.equal(rawData);
      });
    });

    describe("setMinVotes()", () => {
      let newMinVotes = 2;

      it("EOA fails to call setMinVotes() directly", async () => {
        await expect(
          signerContract.setMinVotes(newMinVotes)
        ).to.be.revertedWith("Multisig__OnlyContract");
      });

      it("test_setMinVotes()", async () => {
        await signerContract.test_setMinVotes(newMinVotes);
        let result = await signerContract.s_minVotes();
        expect(result).to.equal(newMinVotes);

        await signerContract.test_setMinVotes(1);
      });

      it("setMinVotes() via multisig", async () => {
        await signerContract.submitProposal(
          signerContract.address,
          0,
          "setMinVotes(uint256)",
          signerContract.interface.encodeFunctionData("setMinVotes", [
            newMinVotes,
          ]),
          "Test setting minimum votes via multisig"
        );

        let proposalIndex =
          (await signerContract.test_getProposals()).length - 1;
        await signerContract.voteOnProposal(proposalIndex);

        await new Promise((r) => setTimeout(r, currentTimeout * 1000));
        await signerContract.executeProposal(proposalIndex);

        let result = await signerContract.s_minVotes();
        expect(result).to.equal(newMinVotes);

        await signerContract.test_setMinVotes(minVotes);
      });
    });
  });
});
