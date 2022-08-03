// deploy/00_deploy_your_contract.js

const { ethers } = require("hardhat");
const { defaultNetwork } = require("../hardhat.config");
const { members } = require("../hardhat-helper-config");

const localChainId = "31337";

// const sleep = (ms) =>
//   new Promise((r) =>
//     setTimeout(() => {
//       console.log(`waited for ${(ms / 1000).toFixed(3)} seconds`);
//       r();
//     }, ms)
//   );

module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();

  if (defaultNetwork.includes("localhost")) {
    await deploy("Test_Call", {
      // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
      from: deployer,
      log: true,
      waitConfirmations: 5,
    });

    await deploy("Test_Multisig", {
      from: deployer,
      log: true,
      waitConfirmations: 5,
      args: [members, 10, 1],
    });
  }
};
module.exports.tags = ["Multisig"];
