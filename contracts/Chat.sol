// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./ChatGroups.sol";

contract Chat is ChatGroups {
    struct UserProfile {
        string username;
        string bio;
        string avatarHash; // IPFS hash for user avatar
        bool isActive;
    }

    mapping(address => UserProfile) public userProfiles;
    mapping(uint256 => mapping(address => uint8)) public messageReactions; // messageId => (user => reaction)

    uint256 public constant MAX_USERNAME_LENGTH = 32;
    uint256 public constant MAX_BIO_LENGTH = 160;

    event MessageReacted(address indexed sender, address indexed reactor, uint256 id, uint8 reaction);
    event ProfileUpdated(address indexed user, string username, string bio, string avatarHash);
    event UserProfileUpdated(address indexed user, string username, string bio);

    modifier validUsername(string memory _username) {
        require(bytes(_username).length > 0, "Username cannot be empty");
        require(bytes(_username).length <= MAX_USERNAME_LENGTH, "Username too long");
        _;
    }

    modifier validBio(string memory _bio) {
        require(bytes(_bio).length <= MAX_BIO_LENGTH, "Bio too long");
        _;
    }

    function sendMessage(string memory _content, address _recipient) 
        public 
        override
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

    function getConversation(address _user) public view returns (Message[] memory) {
        return conversations[_user][_user];
    }

    function getLastMessageTime(address _user) public view returns (uint256) {
        return lastMessageTime[_user];
    }

    function getMessageCount(address _user) public view returns (uint256) {
        return messageCount[_user];
    }

    function createGroup(string memory _name, address[] memory _members) public {
        require(bytes(_name).length > 0, "Group name cannot be empty");
        require(_members.length < MAX_GROUP_SIZE, "Group size exceeded");
        
        groupCount++;
        address[] memory tempMembers = new address[](_members.length + 1);
        uint256 uniqueCount = 0;
        bool senderAdded = false;

        for (uint256 i = 0; i < _members.length; i++) {
            if (_members[i] == msg.sender) {
                senderAdded = true;
                break;
            }
        }
        if (!senderAdded) {
            tempMembers[uniqueCount++] = msg.sender;
        }

        for (uint256 i = 0; i < _members.length; i++) {
            if (_members[i] != address(0) && _members[i] != msg.sender) {
                bool isDuplicate = false;
                for (uint256 j = 0; j < uniqueCount; j++) {
                    if (tempMembers[j] == _members[i]) {
                        isDuplicate = true;
                        break;
                    }
                }
                if (!isDuplicate) {
                    tempMembers[uniqueCount++] = _members[i];
                }
            }
        }

        require(uniqueCount > 1, "Group must have at least 2 members");

        address[] memory finalMembers = new address[](uniqueCount);
        for (uint256 i = 0; i < uniqueCount; i++) {
            finalMembers[i] = tempMembers[i];
        }

        Group storage newGroup = groups[groupCount];
        newGroup.id = groupCount;
        newGroup.members = finalMembers;
        newGroup.name = _name;
        newGroup.admin = msg.sender;
        newGroup.description = "";
        newGroup.avatarHash = "";
        
        for (uint256 i = 0; i < finalMembers.length; i++) {
            userGroups[finalMembers[i]].push(groupCount);
            newGroup.isAdmin[finalMembers[i]] = (finalMembers[i] == msg.sender);
        }
        
        emit GroupCreated(groupCount, _name);
    }

    function sendGroupMessage(string memory _content, uint256 _groupId) 
        public 
        override
        rateLimited 
        validMessage(_content) 
    {
        Group storage group = groups[_groupId];
        require(group.id != 0, "Group does not exist");
        require(isMember(msg.sender, _groupId), "Not a group member");

        uint256 messageId = messageCount[msg.sender]++;
        Message memory newMessage = Message({
            sender: msg.sender,
            content: _content,
            timestamp: block.timestamp,
            recipient: address(0),
            isRead: false,
            id: messageId,
            fileHash: "",
            fileType: "",
            isEdited: false
        });
        
        for (uint256 i = 0; i < group.members.length; i++) {
            conversations[group.members[i]][msg.sender].push(newMessage);
        }
        
        emit MessageSent(msg.sender, _content, block.timestamp, address(0), messageId, "", "");
    }

    function getMessages(address _otherParty, uint256 offset, uint256 limit) 
        public view override returns (Message[] memory) {
        Message[] memory convo = conversations[msg.sender][_otherParty];
        uint256 actualLimit = limit > convo.length ? convo.length : limit;
        Message[] memory result = new Message[](actualLimit);
        
        for (uint256 i = offset; i < offset + actualLimit && i < convo.length; i++) {
            result[i - offset] = convo[i];
        }
        return result;
    }

    function markMessageAsRead(uint256 _messageId) public override {
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

    function deleteMessage(uint256 _messageId) public override {
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

    function setUserProfile(string memory _username, string memory _bio, string memory _avatarHash) public {
        require(bytes(_username).length <= MAX_USERNAME_LENGTH, "Username too long");
        require(bytes(_bio).length <= MAX_BIO_LENGTH, "Bio too long");
        
        userProfiles[msg.sender] = UserProfile({
            username: _username,
            bio: _bio,
            avatarHash: _avatarHash,
            isActive: true
        });
        
        emit ProfileUpdated(msg.sender, _username, _bio, _avatarHash);
    }

    function editMessage(uint256 _messageId, string memory _newContent) 
        public 
        override
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

    function reactToMessage(uint256 _messageId, uint8 _reaction) public {
        require(_reaction > 0 && _reaction <= 5, "Invalid reaction type");
        messageReactions[_messageId][msg.sender] = _reaction;
        emit MessageReacted(msg.sender, msg.sender, _messageId, _reaction);
    }

    function addGroupAdmin(uint256 _groupId, address _newAdmin) public override onlyGroupAdmin(_groupId) {
        Group storage group = groups[_groupId];
        require(isMember(_newAdmin, _groupId), "Not a group member");
        
        group.isAdmin[_newAdmin] = true;
        emit GroupAdminAdded(_groupId, _newAdmin);
    }

    function removeGroupAdmin(uint256 _groupId, address _admin) public override onlyGroupAdmin(_groupId) {
        Group storage group = groups[_groupId];
        require(_admin != msg.sender, "Cannot remove self");
        
        group.isAdmin[_admin] = false;
        emit GroupAdminRemoved(_groupId, _admin);
    }

    function addGroupMember(uint256 _groupId, address _newMember) public override onlyGroupAdmin(_groupId) {
        Group storage group = groups[_groupId];
        require(!isMember(_newMember, _groupId), "Already a member");
        require(group.members.length < MAX_GROUP_SIZE, "Group full");
        
        group.members.push(_newMember);
        userGroups[_newMember].push(_groupId);
        
        emit GroupMemberAdded(_groupId, _newMember);
    }

    function removeGroupMember(uint256 _groupId, address _member) public override onlyGroupAdmin(_groupId) {
        Group storage group = groups[_groupId];
        require(_member != msg.sender, "Cannot remove self");
        
        for (uint256 i = 0; i < group.members.length; i++) {
            if (group.members[i] == _member) {
                group.members[i] = group.members[group.members.length - 1];
                group.members.pop();
                break;
            }
        }
        
        emit GroupMemberRemoved(_groupId, _member);
    }

    function sendMessageWithFile(string memory _content, address _recipient, string memory _fileHash, string memory _fileType) 
        public returns (uint256) {
        require(_recipient != address(0), "Invalid recipient address");
        require(bytes(_content).length > 0 || bytes(_fileHash).length > 0, "Message or file required");
        require(bytes(_content).length <= MAX_MESSAGE_LENGTH, "Message too long");

        uint256 messageId = messageCount[msg.sender]++;
        Message memory newMessage = Message({
            sender: msg.sender,
            content: _content,
            timestamp: block.timestamp,
            recipient: _recipient,
            isRead: false,
            id: messageId,
            fileHash: _fileHash,
            fileType: _fileType,
            isEdited: false
        });
        
        conversations[msg.sender][_recipient].push(newMessage);
        conversations[_recipient][msg.sender].push(newMessage);

        if (!hasConversation(msg.sender, _recipient)) {
            conversationPartners[msg.sender].push(_recipient);
            conversationPartners[_recipient].push(msg.sender);
        }

        emit MessageSent(msg.sender, _content, block.timestamp, _recipient, messageId, _fileHash, _fileType);
        return messageId;
    }

    function getMessageReactions(uint256 _messageId) public view returns (address[] memory, uint8[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < groupCount; i++) {
            if (messageReactions[_messageId][groups[i].members[0]] != 0) {
                count++;
            }
        }

        address[] memory reactors = new address[](count);
        uint8[] memory reactions = new uint8[](count);
        uint256 index = 0;

        for (uint256 i = 0; i < groupCount; i++) {
            if (messageReactions[_messageId][groups[i].members[0]] != 0) {
                reactors[index] = groups[i].members[0];
                reactions[index] = messageReactions[_messageId][groups[i].members[0]];
                index++;
            }
        }

        return (reactors, reactions);
    }

    function updateProfile(string memory _username, string memory _bio, string memory _avatarHash) 
        public 
        validUsername(_username) 
        validBio(_bio) 
    {
        userProfiles[msg.sender] = UserProfile({
            username: _username,
            bio: _bio,
            avatarHash: _avatarHash,
            isActive: true
        });
        emit UserProfileUpdated(msg.sender, _username, _bio);
    }

    function getUserProfile(address _user) public view returns (UserProfile memory) {
        return userProfiles[_user];
    }
}