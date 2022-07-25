# What is a multisig?

A smart contract that allows multiple users to approve transactions before they are executed.

[Here](https://www.youtube.com/watch?v=GHyxe32Z814) is a good overview of Gnosis Safe, which is the industry standard multi sig wallet implementation today.

# Additional information

[Signed messages](https://github.com/scaffold-eth/scaffold-eth-examples/tree/signature-recover)

# How does a multisig actually work?

- Multiple public keys are saved as "signers" in the contract.
- A minimum number threshold of signers is chosen to approve transactions.
- To do something with the funds in the multisig, an encoded transaction is sent from one of the signers to be approved by the others.
  - This transaction will do something on a different contract, but use the funds in the multi sig.
- The signers vote on the transaction. If it passes before a deadline, then the contract signs the transaction and submits it to the network.

# Goals for challenge 5

- [ ] can you edit and deploy the contract with a 2/3 multisig with two of your addresses and the buidlguidl multisig as the third signer? (buidlguidl.eth is like your backup recovery.)

- [ ] can you propose basic transactions with the frontend that sends them to the backend?

- [ ] can you “vote” on the transaction as other signers?

- [ ] can you execute the transaction and does it do the right thing?

- [ ] can you add and remove signers with a custom dialog (that just sends you to the create transaction dialog with the correct calldata)

- [ ] BONUS: multisig as a service! Create a deploy button with a copy paste dialog for sharing so _anyone_ can make a multisig at your url with your frontend

- [ ] BONUS: testing lol
