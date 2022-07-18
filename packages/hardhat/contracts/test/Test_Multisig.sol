//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "../Multisig.sol";

contract Test_Multisig is Multisig {
    constructor(address[] memory _signers) Multisig(_signers) {}

    function test_getSigners() public view returns (address[] memory) {
        return s_signers;
    }

    function test_removeFromSignersArray(uint256 _index, address _signer)
        public
    {
        removeFromSignersArray(_index);
        s_isSigner[_signer] = false;
    }
}
