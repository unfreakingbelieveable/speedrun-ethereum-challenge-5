//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "../Multisig.sol";
import "hardhat/console.sol";

contract Test_Multisig is Multisig {
    constructor(
        address[] memory _signers,
        uint256 _timeout,
        uint256 _minVotes
    ) Multisig(_signers, _timeout, _minVotes) {}

    function test_getSigners() public view returns (address[] memory) {
        return s_signers;
    }

    function test_addToSignersArray(address _signer) public {
        s_signers.push(_signer);
        s_isSigner[_signer] = true;
    }

    function test_getProposals() public view returns (Proposal[] memory) {
        return s_proposals;
    }

    function test_changeTimeout(uint256 _newTimeout) public {
        changeTimeout(_newTimeout);
    }

    function test_findIndexOfSigner(address _signer)
        public
        view
        returns (uint256)
    {
        return findIndexOfSigner(_signer);
    }

    function test_removeSigner(address _signer) public {
        bytes memory _data = abi.encodeWithSignature(
            "removeSigner(address)",
            _signer
        );
        (bool success, ) = address(this).call(_data);
        require(success, "Call on removeSigner failed");
    }

    function test_removeFromSignersArray(uint256 _index, address _signer)
        public
    {
        bytes memory _data = abi.encodeWithSignature(
            "_removeFromSignersArray(uint256)",
            _index
        );
        (bool success, ) = address(this).call(_data);
        require(success, "Call on _removeFromSignersArray failed");
        s_isSigner[_signer] = false;
    }

    function test_getVoteArrayInProposal(uint256 _index)
        public
        view
        returns (address[] memory)
    {
        return s_proposals[_index].voteYes;
    }

    function test_setMinVotes(uint256 _minVotes) public {
        bytes memory _data = abi.encodeWithSignature(
            "setMinVotes(uint256)",
            _minVotes
        );
        (bool success, ) = address(this).call(_data);
        require(success, "Call on setMinVotes() failed");
    }

    function test_executeProposal(
        address _target,
        uint256 _value,
        string memory _function,
        bytes memory _data,
        string memory _description
    ) public returns (bytes memory) {
        console.log("Contract balance: ", address(this).balance);
        Proposal memory _newProposal = Proposal({
            from: msg.sender,
            target: _target,
            value: _value,
            func: _function,
            data: _data,
            description: _description,
            voteYes: new address[](0),
            expiration: block.timestamp + s_expirationTimeout,
            executed: false,
            result: ""
        });

        return _executeProposal(_newProposal);
    }
}
