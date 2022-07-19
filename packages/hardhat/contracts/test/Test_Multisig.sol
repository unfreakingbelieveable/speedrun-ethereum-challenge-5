//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "../Multisig.sol";

contract Test_Multisig is Multisig {
    constructor(address[] memory _signers, uint256 _timeout)
        Multisig(_signers, _timeout)
    {}

    function test_getSigners() public view returns (address[] memory) {
        return s_signers;
    }

    function test_findIndexOfSigner(address _signer)
        public
        view
        returns (uint256)
    {
        return findIndexOfSigner(_signer);
    }

    function test_removeFromSignersArray(uint256 _index, address _signer)
        public
    {
        removeFromSignersArray(_index);
        s_isSigner[_signer] = false;
    }
}
