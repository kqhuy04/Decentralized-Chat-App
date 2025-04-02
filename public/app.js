const chatAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Địa chỉ hợp đồng đã triển khai
const chatABI = [
    "function sendMessage(string memory _content, address _recipient) public",
    "function getMessages(address _recipient) public view returns (tuple(address sender, string content, uint256 timestamp, address recipient)[])",
    "event MessageSent(address indexed sender, string content, uint256 timestamp, address indexed recipient)"
];

let provider;
let signer;
let chatContract;
let userAddress;

async function connectMetaMask() {
    console.log("Bắt đầu kết nối MetaMask...");
    if (typeof window.ethereum !== "undefined") {
        try {
            console.log("Yêu cầu kết nối tài khoản MetaMask...");
            // Yêu cầu kết nối MetaMask
            await window.ethereum.request({ method: "eth_requestAccounts" });
            console.log("Tài khoản đã được kết nối.");

            console.log("Khởi tạo provider...");
            provider = new ethers.providers.Web3Provider(window.ethereum);
            console.log("Provider đã được khởi tạo.");

            console.log("Lấy signer...");
            signer = provider.getSigner();
            console.log("Signer đã được lấy.");

            console.log("Lấy địa chỉ người dùng...");
            userAddress = await signer.getAddress();
            console.log("Địa chỉ người dùng:", userAddress);

            console.log("Khởi tạo contract...");
            chatContract = new ethers.Contract(chatAddress, chatABI, signer);
            console.log("Contract đã được khởi tạo.");

            document.getElementById("account").innerText = userAddress;
            document.getElementById("connectButton").innerText = "Đã kết nối";
            document.getElementById("connectButton").disabled = true;
            console.log("UI đã được cập nhật.");

            // Lắng nghe sự kiện MessageSent
            console.log("Thiết lập listener cho sự kiện MessageSent...");
            chatContract.on("MessageSent", (sender, content, timestamp, recipient) => {
                if (sender === userAddress || recipient === userAddress) {
                    const time = new Date(Number(timestamp) * 1000).toLocaleString();
                    const senderLabel = sender === userAddress ? "Bạn" : sender;
                    appendMessage(`${time} | ${senderLabel} -> ${recipient}: ${content}`);
                    console.log("Tin nhắn mới nhận được:", content);
                }
            });
            console.log("Listener đã được thiết lập.");
        } catch (error) {
            console.error("Lỗi khi kết nối MetaMask:", error);
            alert("Không thể kết nối MetaMask!");
        }
    } else {
        console.log("MetaMask không được cài đặt!");
        alert("Vui lòng cài đặt MetaMask!");
    }
}

async function sendMessage() {
    const recipient = document.getElementById("recipient").value;
    const content = document.getElementById("content").value;

    if (!ethers.utils.isAddress(recipient)) {
        alert("Địa chỉ người nhận không hợp lệ!");
        return;
    }

    if (!chatContract) {
        alert("Vui lòng kết nối MetaMask trước!");
        return;
    }

    try {
        const tx = await chatContract.sendMessage(content, recipient);
        const receipt = await tx.wait(); // Sửa từ "awaited" thành "await"
        console.log("Giao dịch hoàn tất:", receipt);
        document.getElementById("content").value = ""; // Xóa nội dung sau khi gửi
    } catch (error) {
        console.error("Lỗi khi gửi tin nhắn:", error);
        alert("Gửi tin nhắn thất bại!");
    }
}

async function getMessages() {
    const recipient = document.getElementById("fetchRecipient").value;

    if (!ethers.utils.isAddress(recipient)) {
        alert("Địa chỉ không hợp lệ!");
        return;
    }

    if (!chatContract) {
        alert("Vui lòng kết nối MetaMask trước!");
        return;
    }

    try {
        const messages = await chatContract.getMessages(recipient);
        document.getElementById("messages").innerHTML = ""; // Xóa tin nhắn cũ
        messages.forEach((msg) => {
            const time = new Date(Number(msg.timestamp) * 1000).toLocaleString();
            const senderLabel = msg.sender === userAddress ? "Bạn" : msg.sender;
            appendMessage(`${time} | ${senderLabel} -> ${msg.recipient}: ${msg.content}`);
        });
    } catch (error) {
        console.error("Lỗi khi lấy tin nhắn:", error);
        alert("Lấy tin nhắn thất bại!");
    }
}

function appendMessage(message) {
    const messagesDiv = document.getElementById("messages");
    const p = document.createElement("p");
    p.innerText = message;
    messagesDiv.appendChild(p);
    messagesDiv.scrollTop = messagesDiv.scrollHeight; // Cuộn xuống tin nhắn mới nhất
}

// Xử lý khi tài khoản hoặc mạng thay đổi
window.ethereum.on("accountsChanged", () => location.reload());
window.ethereum.on("chainChanged", () => location.reload());