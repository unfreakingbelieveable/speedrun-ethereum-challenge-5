//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

error Multisig__UserIsNotSigner();
error Multisig__UserAlreadySigner();
error Multisig__FunctionNotImplemented();

contract Multisig {
    event SignerAdded(address indexed newSigner);
    event SignerRemoved(address indexed removedSigner);
    event ProposalAdded(address indexed from, string title, uint256 expiration);
    event TimeoutChanged(uint256 newTimeout);

    struct Proposal {
        address from;
        address target;
        uint256 value;
        string func;
        bytes data;
        string description;
        address[] voteYes;
        uint256 expiration;
    }

    uint256 public s_expirationTimeout;
    address[] public s_signers;
    Proposal[] public s_proposals;
    mapping(address => bool) public s_isSigner;

    constructor(address[] memory _signers, uint256 _timeout) {
        s_expirationTimeout = _timeout;
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
            expiration: block.timestamp + s_expirationTimeout
        });
        s_proposals.push(_newProposal);
        emit ProposalAdded(msg.sender, _description, _expirationTime);
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
