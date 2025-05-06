const hre = require("hardhat");

let chatContract;
const conversations = new Map();
const displayedMessages = new Set();
const MESSAGE_LIMIT = 50;

async function connectMetaMask() {
    if (!window.ethereum) {
        alert("Please install MetaMask!");
        return;
    }
    // Add MetaMask connection logic here
}

function appendMessage(messageData) {
    if (displayedMessages.has(messageData.id.toString())) return;
    displayedMessages.add(messageData.id.toString());
    // Add message display logic here
}

async function initializeContract(contractAddress) {
    const Chat = await hre.ethers.getContractFactory("Chat");
    chatContract = await Chat.attach(contractAddress);
    
    // Set up event listeners
    chatContract.on("MessageSent", async (sender, content, timestamp, recipient, id) => {
        const messageData = {
            sender,
            content,
            timestamp,
            recipient,
            id
        };
        
        const otherParty = sender === window.ethereum.selectedAddress ? recipient : sender;
        if (!conversations.has(otherParty)) conversations.set(otherParty, []);
        conversations.get(otherParty).push(messageData);
    });
}

async function setUserPublicKey() {
    try {
        const wallet = ethers.Wallet.createRandom();
        const tx = await chatContract.setPublicKey(wallet.publicKey);
        await tx.wait();
    } catch (error) {
        console.error("Error setting public key:", error);
        throw new Error("Could not set public key: " + error.message);
    }
}

async function loadConversations() {
    conversations.clear();
    displayedMessages.clear();
    // Add conversation loading logic here
    const messages = await chatContract.getMessages(partner, 0, MESSAGE_LIMIT);
    conversations.set(partner, messages);
}

async function markMessagesAsRead(messages, userAddress) {
    messages.filter(m => m.recipient === userAddress && !m.isRead)
        .forEach(async m => {
            try {
                await chatContract.markMessageAsRead(m.id)
            } catch (err) {
                console.warn(`Could not mark message ${m.id} as read:`, err);
            }
        });
}

module.exports = {
    connectMetaMask,
    appendMessage,
    initializeContract,
    setUserPublicKey,
    loadConversations,
    markMessagesAsRead
}; 