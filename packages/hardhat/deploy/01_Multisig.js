// deploy/00_deploy_your_contract.js

const { ethers } = require("hardhat");
const { members } = require("../hardhat-helper-config");
const { defaultNetwork } = require("../hardhat.config");

const localChainId = "31337";

module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();

  let accountsInMultisig;
  let voteTimeout;
  let minVotes;

  if(defaultNetwork.includes("localhost")) {
    accountsInMultisig = [deployer];
    voteTimeout = 30;
    minVotes = 1;
  } else {
    accountsInMultisig = members
    voteTimeout = 9999999 // 1 week
    minVotes = 2
  }

  await deploy("Multisig", {
      // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
      from: deployer,
      args: [accountsInMultisig, voteTimeout, minVotes],
      log: true,
      waitConfirmations: 5,
    });

    // Getting a previously deployed contract
    const Multisig = await ethers.getContract("Multisig", deployer);
};
module.exports.tags = ["Multisig"];
