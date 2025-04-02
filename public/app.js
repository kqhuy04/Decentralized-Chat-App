const chatAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Thay bằng địa chỉ contract thực tế
const chatABI = [
    "function sendMessage(string memory _content, address _recipient) public returns (uint256)",
    "function getMessages(address _otherParty, uint256 offset, uint256 limit) public view returns (tuple(address sender, string content, uint256 timestamp, address recipient, bool isRead, uint256 id)[])",
    "function markMessageAsRead(uint256 _messageId) public",
    "function deleteMessage(uint256 _messageId) public",
    "function getConversationPartners() public view returns (address[] memory)",
    "event MessageSent(address indexed sender, string content, uint256 timestamp, address indexed recipient, uint256 id)",
    "event MessageRead(address indexed reader, address indexed sender, uint256 id)",
    "event MessageDeleted(address indexed sender, uint256 id)"
];

let provider, signer, chatContract, userAddress;
const conversations = new Map();
const displayedMessages = new Set(); // Thêm Set để theo dõi các tin nhắn đã hiển thị
const MESSAGE_LIMIT = 20;
const SECRET_KEY = "my-secret-key"; // Nên thay bằng cơ chế an toàn hơn trong thực tế

async function connectMetaMask() {
    if (!window.ethereum) {
        alert("Please install MetaMask!");
        return;
    }

    try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        userAddress = await signer.getAddress();
        chatContract = new ethers.Contract(chatAddress, chatABI, signer);

        document.getElementById("account").innerText = truncateAddress(userAddress);
        document.getElementById("connectButton").innerText = "Connected";
        document.getElementById("connectButton").disabled = true;

        await loadConversations();
        setupEventListeners();
    } catch (error) {
        console.error("Error connecting MetaMask:", error);
        alert("Failed to connect MetaMask!");
    }
}

async function loadConversations() {
    conversations.clear();
    displayedMessages.clear(); // Xóa các tin nhắn đã hiển thị khi tải lại
    const partners = await chatContract.getConversationPartners();
    
    for (const partner of partners) {
        const messages = await chatContract.getMessages(partner, 0, MESSAGE_LIMIT);
        conversations.set(partner, messages.map(msg => ({
            ...msg,
            content: decryptMessage(msg.content)
        })));
    }

    updateConversationList();
}

function updateConversationList() {
    const conversationList = document.getElementById("conversationList");
    conversationList.innerHTML = "";
    
    conversations.forEach((msgs, address) => {
        const item = document.createElement("div");
        item.classList.add("conversation-item");
        item.innerHTML = `
            <div class="avatar" style="background: ${generateAvatar(address)}"></div>
            <div>${truncateAddress(address)}</div>
            ${msgs.some(m => !m.isRead && m.recipient === userAddress) ? '<span class="unread-dot"></span>' : ''}
        `;
        item.onclick = () => loadChat(address);
        conversationList.appendChild(item);
    });
}

async function loadChat(recipient) {
    document.getElementById("chatRecipient").innerText = truncateAddress(recipient);
    document.getElementById("recipientAddress").innerText = recipient;
    document.getElementById("recipient").value = recipient;
    
    const messagesDiv = document.getElementById("messages");
    messagesDiv.innerHTML = "";
    displayedMessages.clear(); // Xóa các tin nhắn đã hiển thị khi chuyển sang cuộc trò chuyện mới
    
    const messages = conversations.get(recipient) || [];
    messages.forEach(msg => {
        appendMessage({
            ...msg,
            time: new Date(Number(msg.timestamp) * 1000).toLocaleString(),
            status: msg.sender === userAddress ? "sent" : "received"
        });
    });

    messages.filter(m => m.recipient === userAddress && !m.isRead)
        .forEach(m => chatContract.markMessageAsRead(m.id));
}

async function sendMessage() {
    const recipient = document.getElementById("recipient").value.trim();
    const content = document.getElementById("content").value.trim();

    if (!ethers.utils.isAddress(recipient)) {
        alert("Invalid recipient address!");
        return;
    }
    if (!content || !chatContract) {
        alert("Please enter a message and connect MetaMask!");
        return;
    }

    try {
        const encryptedContent = encryptMessage(content);
        const tx = await chatContract.sendMessage(encryptedContent, recipient);
        await tx.wait();
        
        // Không gọi appendMessage ở đây, để listener MessageSent xử lý
        document.getElementById("content").value = "";
    } catch (error) {
        console.error("Error sending message:", error);
        alert("Failed to send message!");
    }
}

function appendMessage(messageData) {
    // Kiểm tra xem tin nhắn đã được hiển thị chưa
    if (displayedMessages.has(messageData.id.toString())) {
        return; // Bỏ qua nếu tin nhắn đã được hiển thị
    }

    displayedMessages.add(messageData.id.toString()); // Thêm ID tin nhắn vào Set

    const messagesDiv = document.getElementById("messages");
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", messageData.status);
    messageDiv.innerHTML = `
        <div class="message-content">
            ${messageData.content}
            <div class="message-actions">
                ${messageData.sender === userAddress ? 
                    `<button onclick="deleteMessage('${messageData.id}')">🗑️</button>` : ''}
            </div>
        </div>
        <div class="message-time">${messageData.time}</div>
        <div class="message-status">${messageData.isRead ? '✓✓' : '✓'}</div>
    `;
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

async function deleteMessage(messageId) {
    try {
        const tx = await chatContract.deleteMessage(messageId);
        await tx.wait();
        const currentRecipient = document.getElementById("recipient").value;
        conversations.get(currentRecipient).forEach((msg, index) => {
            if (msg.id.toString() === messageId.toString()) {
                conversations.get(currentRecipient).splice(index, 1);
                displayedMessages.delete(messageId.toString()); // Xóa khỏi danh sách đã hiển thị
            }
        });
        await loadChat(currentRecipient);
        updateConversationList();
    } catch (error) {
        console.error("Error deleting message:", error);
    }
}

function setupEventListeners() {
    chatContract.on("MessageSent", async (sender, content, timestamp, recipient, id) => {
        if (sender === userAddress || recipient === userAddress) {
            const otherParty = sender === userAddress ? recipient : sender;
            const messageData = {
                sender,
                content: decryptMessage(content),
                timestamp,
                recipient,
                isRead: false,
                id
            };
            
            if (!conversations.has(otherParty)) conversations.set(otherParty, []);
            conversations.get(otherParty).push(messageData);
            
            if (document.getElementById("recipient").value === otherParty) {
                appendMessage({
                    ...messageData,
                    time: new Date(Number(timestamp) * 1000).toLocaleString(),
                    status: sender === userAddress ? "sent" : "received"
                });
            }
            updateConversationList();
        }
    });

    chatContract.on("MessageRead", (reader, sender, id) => {
        conversations.forEach(msgs => {
            const msg = msgs.find(m => m.id.toString() === id.toString());
            if (msg) msg.isRead = true;
        });
        if (document.getElementById("recipient").value) loadChat(document.getElementById("recipient").value);
    });

    window.ethereum.on("accountsChanged", () => location.reload());
    window.ethereum.on("chainChanged", () => location.reload());
}

function encryptMessage(content) {
    return CryptoJS.AES.encrypt(content, SECRET_KEY).toString();
}

function decryptMessage(content) {
    const bytes = CryptoJS.AES.decrypt(content, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
}

function generateAvatar(address) {
    const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(address));
    const r = parseInt(hash.slice(2, 4), 16);
    const g = parseInt(hash.slice(4, 6), 16);
    const b = parseInt(hash.slice(6, 8), 16);
    return `linear-gradient(45deg, rgb(${r},${g},${b}), rgb(${g},${b},${r}))`;
}

function truncateAddress(address) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function toggleTheme() {
    document.body.dataset.theme = document.body.dataset.theme === "dark" ? "light" : "dark";
}