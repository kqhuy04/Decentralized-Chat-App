// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Chat {
    struct Message {
        address sender;
        string content;
        uint256 timestamp;
        address recipient;
    }

    Message[] public messages;

    event MessageSent(address indexed sender, string content, uint256 timestamp, address indexed recipient);

    function sendMessage(string memory _content, address _recipient) public {
        messages.push(Message(msg.sender, _content, block.timestamp, _recipient));
        emit MessageSent(msg.sender, _content, block.timestamp, _recipient);
    }

    function getMessages(address _recipient) public view returns (Message[] memory) {
        uint count = 0;
        for (uint i = 0; i < messages.length; i++) {
            if (messages[i].recipient == _recipient || messages[i].sender == _recipient) {
                count++;
            }
        }

        Message[] memory result = new Message[](count);
        uint index = 0;
        for (uint i = 0; i < messages.length; i++) {
            if (messages[i].recipient == _recipient || messages[i].sender == _recipient) {
                result[index] = messages[i];
                index++;
            }
        }
        return result;
    }
}