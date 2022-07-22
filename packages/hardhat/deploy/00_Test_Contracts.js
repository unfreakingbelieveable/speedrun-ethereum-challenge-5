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

    // Getting a previously deployed contract
    // const Multisig = await ethers.getContract("Multisig", deployer);
    /*  await Multisig.setPurpose("Hello");
  
    // To take ownership of Multisig using the ownable library uncomment next line and add the 
    // address you want to be the owner. 
    
    await Multisig.transferOwnership(
      "ADDRESS_HERE"
    );

    //const Multisig = await ethers.getContractAt('Multisig', "0xaAC799eC2d00C013f1F11c37E654e59B0429DF6A") //<-- if you want to instantiate a version of a contract at a specific address!
  */

    /*
  //If you want to send value to an address from the deployer
  const deployerWallet = ethers.provider.getSigner()
  await deployerWallet.sendTransaction({
    to: "0x34aA3F359A9D614239015126635CE7732c18fDF3",
    value: ethers.utils.parseEther("0.001")
  })
  */

    /*
  //If you want to send some ETH to a contract on deploy (make your constructor payable!)
  const Multisig = await deploy("Multisig", [], {
  value: ethers.utils.parseEther("0.05")
  });
  */

    /*
  //If you want to link a library into your contract:
  // reference: https://github.com/austintgriffith/scaffold-eth/blob/using-libraries-example/packages/hardhat/scripts/deploy.js#L19
  const Multisig = await deploy("Multisig", [], {}, {
   LibraryName: **LibraryAddress**
  });
  */

    // Verify from the command line by running `yarn verify`

    // You can also Verify your contracts with Etherscan here...
    // You don't want to verify on localhost
    // try {
    //   if (chainId !== localChainId) {
    //     await run("verify:verify", {
    //       address: Multisig.address,
    //       contract: "contracts/Multisig.sol:Multisig",
    //       constructorArguments: [],
    //     });
    //   }
    // } catch (error) {
    //   console.error(error);
    // }
  }
};
module.exports.tags = ["Multisig"];
