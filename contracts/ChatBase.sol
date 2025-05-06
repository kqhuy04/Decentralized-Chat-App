// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

abstract contract ChatBase {
    struct Message {
        address sender;
        string content;
        uint256 timestamp;
        address recipient;
        bool isRead;
        uint256 id;
        string fileHash;
        string fileType;
        bool isEdited;
    }

    // State variables
    mapping(address => mapping(address => Message[])) public conversations;
    mapping(address => address[]) public conversationPartners;
    mapping(address => uint256) public messageCount;
    mapping(address => bytes) public publicKeys;
    mapping(address => mapping(uint256 => bool)) public messageEdits;
    mapping(address => mapping(uint256 => bool)) public messageDeletes;
    mapping(address => uint256) public lastMessageTime;

    // Constants
    uint256 public constant MAX_MESSAGE_LENGTH = 1000;
    uint256 public constant MAX_MESSAGE_SIZE = 1000;
    uint256 public constant MESSAGE_COOLDOWN = 1 seconds;
    uint256 public constant MAX_MESSAGES_PER_MINUTE = 60;

    // Events
    event MessageSent(address indexed sender, string content, uint256 timestamp, address indexed recipient, uint256 id, string fileHash, string fileType);
    event MessageRead(address indexed reader, address indexed sender, uint256 id);
    event MessageDeleted(address indexed sender, uint256 id);
    event MessageEdited(address indexed sender, uint256 id, string newContent);
    event RateLimitExceeded(address indexed user);
    event MessageSizeExceeded(address indexed user);
    event InvalidRecipient(address indexed recipient);

    // Modifiers
    modifier rateLimited() virtual {
        require(
            block.timestamp >= lastMessageTime[msg.sender] + MESSAGE_COOLDOWN,
            "Message cooldown period not passed"
        );
        require(
            messageCount[msg.sender] < MAX_MESSAGES_PER_MINUTE,
            "Message rate limit exceeded"
        );
        _;
        lastMessageTime[msg.sender] = block.timestamp;
        messageCount[msg.sender]++;
    }

    modifier validMessage(string memory _content) virtual {
        require(bytes(_content).length <= MAX_MESSAGE_SIZE, "Message too long");
        require(bytes(_content).length > 0, "Message cannot be empty");
        _;
    }

    modifier validRecipient(address _recipient) virtual {
        require(_recipient != address(0), "Invalid recipient address");
        require(_recipient != msg.sender, "Cannot send message to self");
        _;
    }

    // Functions
    function setPublicKey(bytes memory _publicKey) public virtual {
        publicKeys[msg.sender] = _publicKey;
    }

    function getPublicKey(address _user) public view virtual returns (bytes memory) {
        return publicKeys[_user];
    }

    function sendMessage(string memory _content, address _recipient) 
        public 
        virtual
        rateLimited 
        validMessage(_content) 
        validRecipient(_recipient) 
        returns (uint256) 
    {
        uint256 messageId = messageCount[msg.sender]++;
        Message memory newMessage = Message({
            sender: msg.sender,
            content: _content,
            timestamp: block.timestamp,
            recipient: _recipient,
            isRead: false,
            id: messageId,
            fileHash: "",
            fileType: "",
            isEdited: false
        });
        
        conversations[msg.sender][_recipient].push(newMessage);
        conversations[_recipient][msg.sender].push(newMessage);

        if (!hasConversation(msg.sender, _recipient)) {
            conversationPartners[msg.sender].push(_recipient);
            conversationPartners[_recipient].push(msg.sender);
        }

        emit MessageSent(msg.sender, _content, block.timestamp, _recipient, messageId, "", "");
        return messageId;
    }

    function getMessages(address _otherParty, uint256 offset, uint256 limit) 
        public view virtual returns (Message[] memory) {
        Message[] memory convo = conversations[msg.sender][_otherParty];
        uint256 actualLimit = limit > convo.length ? convo.length : limit;
        Message[] memory result = new Message[](actualLimit);
        
        for (uint256 i = offset; i < offset + actualLimit && i < convo.length; i++) {
            result[i - offset] = convo[i];
        }
        return result;
    }

    function markMessageAsRead(uint256 _messageId) public virtual {
        Message[] storage userMessages = conversations[msg.sender][msg.sender];
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

    function deleteMessage(uint256 _messageId) public virtual {
        Message[] storage senderMessages = conversations[msg.sender][msg.sender];
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

        Message[] storage recipientMessages = conversations[recipient][msg.sender];
        for (uint256 i = 0; i < recipientMessages.length; i++) {
            if (recipientMessages[i].id == _messageId && recipientMessages[i].sender == msg.sender) {
                delete recipientMessages[i];
                break;
            }
        }
        emit MessageDeleted(msg.sender, _messageId);
    }

    function getConversationPartners() public view virtual returns (address[] memory) {
        return conversationPartners[msg.sender];
    }

    function hasConversation(address _sender, address _recipient) public view virtual returns (bool) {
        address[] memory partners = conversationPartners[_sender];
        for (uint256 i = 0; i < partners.length; i++) {
            if (partners[i] == _recipient) return true;
        }
        return false;
    }

    function editMessage(uint256 _messageId, string memory _newContent) 
        public 
        virtual
        validMessage(_newContent) 
    {
        Message storage message = conversations[msg.sender][msg.sender][_messageId];
        require(message.sender == msg.sender, "Not message sender");
        require(!messageDeletes[msg.sender][_messageId], "Message deleted");
        require(block.timestamp <= message.timestamp + 24 hours, "Message too old to edit");
        
        message.content = _newContent;
        message.isEdited = true;
        messageEdits[msg.sender][_messageId] = true;
        
        emit MessageEdited(msg.sender, _messageId, _newContent);
    }
} 