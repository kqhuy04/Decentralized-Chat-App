// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./ChatBase.sol";

abstract contract ChatGroups is ChatBase {
    struct Group {
        uint256 id;
        address[] members;
        string name;
        address admin;
        mapping(address => bool) isAdmin;
        string description;
        string avatarHash;
    }

    mapping(uint256 => Group) public groups;
    mapping(address => uint256[]) public userGroups;
    uint256 public groupCount;
    uint256 public constant MAX_GROUP_SIZE = 100;

    event GroupCreated(uint256 indexed groupId, string name);
    event GroupMemberAdded(uint256 indexed groupId, address member);
    event GroupMemberRemoved(uint256 indexed groupId, address member);
    event GroupAdminAdded(uint256 indexed groupId, address admin);
    event GroupAdminRemoved(uint256 indexed groupId, address admin);
    event GroupSizeExceeded(uint256 indexed groupId);

    modifier onlyGroupAdmin(uint256 _groupId) virtual {
        require(groups[_groupId].admin == msg.sender, "Not group admin");
        _;
    }

    modifier onlyGroupMember(uint256 _groupId) virtual {
        require(isMember(msg.sender, _groupId), "Not a group member");
        _;
    }

    function createGroup(string memory _name, string memory _description) public virtual returns (uint256) {
        require(bytes(_name).length > 0, "Group name cannot be empty");
        
        groupCount++;
        address[] memory tempMembers = new address[](1);
        tempMembers[0] = msg.sender;

        Group storage newGroup = groups[groupCount];
        newGroup.id = groupCount;
        newGroup.members = tempMembers;
        newGroup.name = _name;
        newGroup.admin = msg.sender;
        newGroup.description = _description;
        newGroup.avatarHash = "";
        
        userGroups[msg.sender].push(groupCount);
        newGroup.isAdmin[msg.sender] = true;
        
        emit GroupCreated(groupCount, _name);
        return groupCount;
    }

    function sendGroupMessage(string memory _content, uint256 _groupId) 
        public 
        virtual
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

    function isMember(address _user, uint256 _groupId) public view virtual returns (bool) {
        address[] memory members = groups[_groupId].members;
        for (uint256 i = 0; i < members.length; i++) {
            if (members[i] == _user) return true;
        }
        return false;
    }

    function addGroupMember(uint256 _groupId, address _member) public virtual onlyGroupAdmin(_groupId) {
        Group storage group = groups[_groupId];
        require(!isMember(_member, _groupId), "Already a member");
        require(group.members.length < MAX_GROUP_SIZE, "Group full");
        
        group.members.push(_member);
        userGroups[_member].push(_groupId);
        
        emit GroupMemberAdded(_groupId, _member);
    }

    function removeGroupMember(uint256 _groupId, address _member) public virtual onlyGroupAdmin(_groupId) {
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

    function addGroupAdmin(uint256 _groupId, address _admin) public virtual onlyGroupAdmin(_groupId) {
        Group storage group = groups[_groupId];
        require(isMember(_admin, _groupId), "Not a group member");
        
        group.isAdmin[_admin] = true;
        emit GroupAdminAdded(_groupId, _admin);
    }

    function removeGroupAdmin(uint256 _groupId, address _admin) public virtual onlyGroupAdmin(_groupId) {
        Group storage group = groups[_groupId];
        require(_admin != msg.sender, "Cannot remove self");
        
        group.isAdmin[_admin] = false;
        emit GroupAdminRemoved(_groupId, _admin);
    }

    function getGroupMembers(uint256 _groupId) public view virtual returns (address[] memory) {
        return groups[_groupId].members;
    }

    function getGroupAdmins(uint256 _groupId) public view virtual returns (address[] memory) {
        Group storage group = groups[_groupId];
        uint256 adminCount = 0;
        
        for (uint256 i = 0; i < group.members.length; i++) {
            if (group.isAdmin[group.members[i]]) {
                adminCount++;
            }
        }
        
        address[] memory admins = new address[](adminCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < group.members.length; i++) {
            if (group.isAdmin[group.members[i]]) {
                admins[index++] = group.members[i];
            }
        }
        
        return admins;
    }

    function getUserGroups() public view virtual returns (uint256[] memory) {
        uint256[] memory userGroupsArray = new uint256[](userGroups[msg.sender].length);
        for (uint256 i = 0; i < userGroups[msg.sender].length; i++) {
            userGroupsArray[i] = userGroups[msg.sender][i];
        }
        return userGroupsArray;
    }

    function isGroupMember(uint256 _groupId, address _member) public view virtual returns (bool) {
        return isMember(_member, _groupId);
    }

    function isGroupAdmin(uint256 _groupId, address _admin) public view virtual returns (bool) {
        return groups[_groupId].isAdmin[_admin];
    }
} 