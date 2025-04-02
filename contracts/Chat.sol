// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Chat {
    struct Message {
        address sender;
        string content;
        uint256 timestamp;
        address recipient;
        bool isRead;
        uint256 id;
    }

    mapping(address => Message[]) private messages;
    mapping(address => address[]) private conversationPartners;
    mapping(address => uint256) private messageCount;
    
    event MessageSent(address indexed sender, string content, uint256 timestamp, address indexed recipient, uint256 id);
    event MessageRead(address indexed reader, address indexed sender, uint256 id);
    event MessageDeleted(address indexed sender, uint256 id);

    function sendMessage(string memory _content, address _recipient) public returns (uint256) {
        require(_recipient != address(0), "Invalid recipient address");
        require(bytes(_content).length > 0, "Message cannot be empty");

        uint256 messageId = messageCount[msg.sender]++;
        Message memory newMessage = Message(msg.sender, _content, block.timestamp, _recipient, false, messageId);
        
        messages[msg.sender].push(newMessage);
        messages[_recipient].push(newMessage);

        if (!hasConversation(msg.sender, _recipient)) {
            conversationPartners[msg.sender].push(_recipient);
            conversationPartners[_recipient].push(msg.sender);
        }

        emit MessageSent(msg.sender, _content, block.timestamp, _recipient, messageId);
        return messageId;
    }

    function getMessages(address _otherParty, uint256 offset, uint256 limit) 
        public view returns (Message[] memory) {
        Message[] memory userMessages = messages[msg.sender];
        uint256 count = 0;

        for (uint256 i = 0; i < userMessages.length; i++) {
            if (userMessages[i].recipient == _otherParty || userMessages[i].sender == _otherParty) {
                count++;
            }
        }

        uint256 actualLimit = limit > count ? count : limit;
        Message[] memory result = new Message[](actualLimit);
        uint256 index = 0;
        
        for (uint256 i = offset; i < userMessages.length && index < actualLimit; i++) {
            if (userMessages[i].recipient == _otherParty || userMessages[i].sender == _otherParty) {
                result[index] = userMessages[i];
                index++;
            }
        }
        return result;
    }

    function markMessageAsRead(uint256 _messageId) public {
        Message[] storage userMessages = messages[msg.sender];
        bool found = false;
        for (uint256 i = 0; i < userMessages.length; i++) {
            if (userMessages[i].id == _messageId && userMessages[i].recipient == msg.sender) {
                userMessages[i].isRead = true;
                emit MessageRead(msg.sender, userMessages[i].sender, _messageId);
                found = true;
                break;
            }
        }
        require(found, "Message not found or not yours");
    }

    function deleteMessage(uint256 _messageId) public {
        Message[] storage senderMessages = messages[msg.sender];
        bool found = false;
        address recipient;

        for (uint256 i = 0; i < senderMessages.length; i++) {
            if (senderMessages[i].id == _messageId && senderMessages[i].sender == msg.sender) {
                recipient = senderMessages[i].recipient;
                delete senderMessages[i];
                found = true;
                break;
            }
        }
        require(found, "Message not found or not yours");

        Message[] storage recipientMessages = messages[recipient];
        for (uint256 i = 0; i < recipientMessages.length; i++) {
            if (recipientMessages[i].id == _messageId && recipientMessages[i].sender == msg.sender) {
                delete recipientMessages[i];
                break;
            }
        }
        emit MessageDeleted(msg.sender, _messageId);
    }

    function getConversationPartners() public view returns (address[] memory) {
        return conversationPartners[msg.sender];
    }

    function hasConversation(address _sender, address _recipient) private view returns (bool) {
        address[] memory partners = conversationPartners[_sender];
        for (uint256 i = 0; i < partners.length; i++) {
            if (partners[i] == _recipient) return true;
        }
        return false;
    }
}