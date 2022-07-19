//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

error Multisig__UserIsNotSigner();
error Multisig__UserAlreadySigner();

contract Multisig {
    event SignerAdded(address indexed newSigner);
    event SignerRemoved(address indexed removedSigner);
    event ProposalAdded(address indexed from, string title, uint256 expiration);
    event TimeoutChanged(uint256 newTimeout);

    struct Proposal {
        address from;
        bytes transaction;
        string description;
        address[] voteYes;
        uint256 expiration;
    }

    uint256 public s_expirationTimeout;
    address[] public s_signers;
    Proposal[] public s_proposals;
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

    function submitProposal(
        bytes calldata _transaction,
        string memory _description
    ) external OnlySigners {
        uint256 _expirationTime = block.timestamp + s_expirationTimeout;

        Proposal memory _newProposal = Proposal({
            from: msg.sender,
            transaction: _transaction,
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
    receive() external payable {}

    fallback() external payable {}

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
