//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

error Multisig__UserIsNotSigner();
error Multisig__UserAlreadySigner();

contract Multisig {
    event SignerAdded(address indexed newSigner);

    address[] public s_signers;
    mapping(address => bool) public s_isSigner;

    constructor(address[] memory _signers) {
        s_signers = _signers;

        for (uint256 i = 0; i < _signers.length; i++) {
            s_isSigner[_signers[i]] = true;
        }
    }

    modifier OnlySigners() {
        if (!s_isSigner[msg.sender]) {
            revert Multisig__UserIsNotSigner();
        }
        _;
    }

    function addSigner(address _signer) external OnlySigners {
        if (s_isSigner[_signer]) {
            revert Multisig__UserAlreadySigner();
        }

        s_isSigner[_signer] = true;
        s_signers.push(_signer);
        emit SignerAdded(_signer);
    }

    // to support receiving ETH by default
    receive() external payable {}

    fallback() external payable {}
}
