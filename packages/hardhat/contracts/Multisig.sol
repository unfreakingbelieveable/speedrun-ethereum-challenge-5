//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Multisig is Ownable {
    event SignerAdded(address indexed newSigner);

    address[] public s_signers;
    mapping(address => bool) public s_isSigner;

    constructor(address[] memory _signers) payable {
        s_signers = _signers;

        for (uint256 i = 0; i < _signers.length; i++) {
            s_isSigner[_signers[i]] = true;
        }
    }

    function addSigner(address _signer) external onlyOwner {
        s_isSigner[_signer] = true;
        s_signers.push(_signer);
        emit SignerAdded(_signer);
    }

    // to support receiving ETH by default
    receive() external payable {}

    fallback() external payable {}
}
