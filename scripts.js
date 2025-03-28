const ethers = require("ethers");

// ABI của hợp đồng Chat
const chatABI = [
    "function getMessages(address _recipient) public view returns (tuple(address sender, string content, uint256 timestamp, address recipient)[])",
    "event MessageSent(address indexed sender, string content, uint256 timestamp, address indexed recipient)"
];

// Địa chỉ hợp đồng và provider
const chatAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Thay bằng địa chỉ hợp đồng của bạn
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
const chatContract = new ethers.Contract(chatAddress, chatABI, provider);

// Hàm kiểm tra URL hình ảnh
function isImageUrl(content) {
    return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(content);
}

// Hàm lấy và hiển thị tin nhắn
async function fetchMessages() {
    const recipientAddress = document.getElementById("recipientAddress").value;
    if (!ethers.isAddress(recipientAddress)) {
        alert("Vui lòng nhập địa chỉ hợp lệ (bắt đầu bằng 0x)!");
        return;
    }

    try {
        const messages = await chatContract.getMessages(recipientAddress);
        const messageList = document.getElementById("messageList");
        messageList.innerHTML = ""; // Xóa danh sách cũ

        if (messages.length === 0) {
            messageList.innerHTML = "<p>Chưa có tin nhắn nào.</p>";
            return;
        }

        messages.forEach((msg) => {
            const timestampInMs = Number(msg.timestamp) * 1000;
            const time = new Date(timestampInMs).toLocaleString();
            const sender = msg.sender;
            const recipient = msg.recipient;
            const content = msg.content;

            const messageDiv = document.createElement("div");
            messageDiv.classList.add("message");
            messageDiv.innerHTML = `
                <span class="time">[${time}]</span>
                <span class="sender">${sender}</span> -> 
                <span class="recipient">${recipient}</span>: 
                <span class="content">${content}</span>
            `;

            if (isImageUrl(content)) {
                const imgLink = document.createElement("div");
                imgLink.innerHTML = `<a href="${content}" target="_blank">Xem hình ảnh</a>`;
                messageDiv.appendChild(imgLink);
            }

            messageList.appendChild(messageDiv);
        });
    } catch (error) {
        console.error("Lỗi khi lấy tin nhắn:", error);
        alert("Có lỗi xảy ra khi lấy tin nhắn. Xem console để biết chi tiết.");
    }
}

// Lắng nghe sự kiện MessageSent để cập nhật tự động
chatContract.on("MessageSent", (sender, content, timestamp, recipient) => {
    const recipientAddress = document.getElementById("recipientAddress").value;
    if (recipientAddress && (sender === recipientAddress || recipient === recipientAddress)) {
        fetchMessages(); // Tự động cập nhật khi có tin nhắn mới liên quan
    }
});