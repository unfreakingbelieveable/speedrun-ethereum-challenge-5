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

    function test_getVoteArrayInProposal(uint256 _index)
        public
        view
        returns (address[] memory)
    {
        return s_proposals[_index].voteYes;
    }

    function test_executeProposal(
        address _target,
        uint256 _value,
        string memory _function,
        bytes memory _data,
        string memory _description
    ) public returns (bytes memory) {
        Proposal memory _newProposal = Proposal({
            from: msg.sender,
            target: _target,
            value: _value,
            func: _function,
            data: abi.encode(_data),
            description: _description,
            voteYes: new address[](0),
            expiration: block.timestamp + s_expirationTimeout,
            executed: false,
            result: ""
        });

        return _executeProposal(_newProposal);
    }

    function test_encodeData(string memory _function, bytes memory _data)
        public
        pure
        returns (bytes memory)
    {
        return _encodeData(_function, _data);
    }
}
