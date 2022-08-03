//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "hardhat/console.sol";

contract Test_Call {
    string public message = "Hello World!";

    function changeMessage(string memory _newMessage) external {
        // require(msg.value >= 0.0001 ether);
        console.log("Sender: ", msg.sender);
        console.log("Data: ", string(msg.data));
        message = _newMessage;
    }

    function changeMessageWithValue(string memory _newMessage) external payable {
        require(msg.value > 0, "No ether was sent!");
        console.log("Sender: ", msg.sender);
        console.log("Value: ", msg.value);
        console.log("Data: ", string(msg.data));
        message = _newMessage;
    }
}
