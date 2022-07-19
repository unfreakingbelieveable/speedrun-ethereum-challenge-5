//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

error Multisig__VotingNotEnded();
error Multisig__ProposalExpired();
error Multisig__UserIsNotSigner();
error Multisig__UserAlreadySigner();
error Multisig__ProposalDidNotPass();
error Multisig__FunctionNotImplemented();
error Multisig__ProposalExecutionFailed();

contract Multisig {
    event TimeoutChanged(uint256 newTimeout);
    event SignerAdded(address indexed newSigner);
    event ProposalExecuted(uint256 indexed index);
    event SignerRemoved(address indexed removedSigner);
    event SignerVoted(address indexed signer, uint256 indexed index);
    event ProposalAdded(address indexed from, string title, uint256 expiration);

    struct Proposal {
        address from;
        address target;
        uint256 value;
        string func;
        bytes data;
        string description;
        address[] voteYes;
        uint256 expiration;
        bool executed;
        bytes result;
    }

    uint256 public s_minVotes;
    address[] public s_signers;
    Proposal[] public s_proposals;
    uint256 public s_expirationTimeout;
    mapping(address => bool) public s_isSigner;

    // TODO: Make minvotes dynamic
    constructor(address[] memory _signers, uint256 _timeout) {
        s_expirationTimeout = _timeout;
        s_signers = _signers;
        s_minVotes = 2;

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

    // ---------------------------------------------------------------
    // Main Multisig Operations
    // ---------------------------------------------------------------
    function changeTimeout(uint256 _newTimeout) external OnlySigners {
        s_expirationTimeout = _newTimeout;
        emit TimeoutChanged(_newTimeout);
    }

    function addSigner(address _signer) external OnlySigners {
        if (s_isSigner[_signer]) {
            revert Multisig__UserAlreadySigner();
        }

        s_isSigner[_signer] = true;
        s_signers.push(_signer);
        emit SignerAdded(_signer);
    }

    function removeSigner(address _signer) external OnlySigners {
        if (!s_isSigner[_signer]) {
            revert Multisig__UserIsNotSigner();
        }

        uint256 removeIndex = findIndexOfSigner(_signer);
        removeFromSignersArray(removeIndex);
        s_isSigner[_signer] = false;
        emit SignerRemoved(_signer);
    }

    /**
     * @notice A fair bit of this is stolen shamelessly from https://solidity-by-example.org/app/time-lock/
     * @notice I didn't cheat by looking at the multi-sig example ;)
     *
     * @dev this function submits proposals to the multisig queue
     *
     * @param _target Address of contract or account to call
     * @param _value Amount of ETH to send
     * @param _function Function signature, for example "foo(address,uint256)"
     * @param _data ABI encoded data send.
     */
    function submitProposal(
        address _target,
        uint256 _value,
        string calldata _function,
        bytes calldata _data,
        string memory _description
    ) external OnlySigners {
        uint256 _expirationTime = block.timestamp + s_expirationTimeout;

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
        s_proposals.push(_newProposal);
        emit ProposalAdded(msg.sender, _description, _expirationTime);
    }

    function voteOnProposal(uint256 _index) external OnlySigners {
        Proposal storage _proposal = s_proposals[_index];

        if (block.timestamp > _proposal.expiration) {
            revert Multisig__ProposalExpired();
        }

        _proposal.voteYes.push(msg.sender);
        emit SignerVoted(msg.sender, _index);
    }

    function executeProposal(uint256 _index) external OnlySigners {
        Proposal memory _proposal = s_proposals[_index];

        if (_proposal.expiration > block.timestamp) {
            revert Multisig__VotingNotEnded();
        }

        if (_proposal.voteYes.length < s_minVotes) {
            revert Multisig__ProposalDidNotPass();
        }

        bytes memory _result = _executeProposal(_proposal);

        s_proposals[_index].executed = true;
        s_proposals[_index].result = _result;
        emit ProposalExecuted(_index);
    }

    /**
     * @dev Splitting this out was done for testing purposes
     */
    function _executeProposal(Proposal memory _proposal)
        internal
        returns (bytes memory)
    {
        bytes memory _data = _encodeData(_proposal.func, _proposal.data);

        (bool success, bytes memory result) = _proposal.target.call{
            value: _proposal.value
        }(_data);

        if (!success) {
            revert Multisig__ProposalExecutionFailed();
        }

        return result;
    }

    /**
     * @dev Splitting this out was done for testing purposes
     */
    function _encodeData(string memory _function, bytes memory _data)
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodePacked(bytes4(keccak256(bytes(_function))), _data);
    }

    // ---------------------------------------------------------------
    // to support receiving ETH by default
    // ---------------------------------------------------------------
    receive() external payable {
        revert Multisig__FunctionNotImplemented();
    }

    fallback() external payable {
        revert Multisig__FunctionNotImplemented();
    }

    // ---------------------------------------------------------------
    // Array operations Helper methods
    // ---------------------------------------------------------------
    function findIndexOfSigner(address _signer)
        internal
        view
        returns (uint256 index)
    {
        if (!s_isSigner[_signer]) {
            revert Multisig__UserIsNotSigner();
        }
        for (uint256 i = 0; i < s_signers.length; i++) {
            if (s_signers[i] == _signer) {
                index = i;
                break;
            }
        }
    }

    // Shamelessly stolen from: https://solidity-by-example.org/array/
    // The last element overwrites the element we want to delete, then we pop the last element
    function removeFromSignersArray(uint _index) internal OnlySigners {
        s_signers[_index] = s_signers[s_signers.length - 1];
        s_signers.pop();
    }
}
