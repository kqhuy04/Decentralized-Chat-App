const ethers = require("ethers");
const readline = require("readline");

const chatABI = [
  "function sendMessage(string memory _content, address _recipient) public",
  "function getMessages(address _recipient) public view returns (tuple(address sender, string content, uint256 timestamp, address recipient)[])",
  "event MessageSent(address indexed sender, string content, uint256 timestamp, address indexed recipient)"
];

const chatAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Thay bằng địa chỉ hợp đồng của bạn
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // Private key của 0xf39Fd6e51aad...
const wallet = new ethers.Wallet(privateKey, provider);
const chatContract = new ethers.Contract(chatAddress, chatABI, wallet);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function sendMessage(content, recipient) {
  const tx = await chatContract.sendMessage(content, recipient);
  const receipt = await tx.wait();
  const gasUsed = receipt.gasUsed;

  let gasPrice = receipt.effectiveGasPrice;
  if (!gasPrice) {
    console.warn("effectiveGasPrice không có, dùng giá mặc định 1 Gwei");
    gasPrice = ethers.parseUnits("1", "gwei");
  }

  const costInWei = gasUsed * gasPrice;
  const costInEth = ethers.formatEther(costInWei);

  console.log(`Đã gửi: "${content}" từ ${wallet.address} đến ${recipient}`);
  console.log(`Gas đã dùng: ${gasUsed.toString()}`);
  console.log(`Giá gas: ${ethers.formatUnits(gasPrice, "gwei")} Gwei`);
  console.log(`Tổng chi phí: ${costInEth} ETH`);

  if (isImageUrl(content)) {
    console.log(`Hình ảnh: ${content}`);
    console.log("Mở link trên trình duyệt để xem hình ảnh.");
  }
}

async function getMessages(recipient) {
  const messages = await chatContract.getMessages(recipient);
  console.log(`\n=== Tin nhắn với ${recipient} ===`);
  messages.forEach((msg, index) => {
    const sender = msg.sender === wallet.address ? "Bạn" : msg.sender;
    const timestampInMs = Number(msg.timestamp) * 1000; // Chuyển BigInt sang number
    console.log(`${index + 1}. [${new Date(timestampInMs).toLocaleString()}] ${sender} -> ${msg.recipient}: ${msg.content}`);
    if (isImageUrl(msg.content)) {
      console.log(`   (Hình ảnh: ${msg.content})`);
    }
  });
  console.log("================");
}

function isImageUrl(content) {
  return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(content);
}

function startChat() {
  rl.question('Nhập "send <địa chỉ người nhận> <tin nhắn>" hoặc "get <địa chỉ người nhận>" (hoặc "exit" để thoát): ', async (input) => {
    const [command, ...args] = input.split(" ");
    
    if (command.toLowerCase() === "exit") {
      rl.close();
      return;
    } else if (command.toLowerCase() === "send" && args.length >= 2) {
      const recipient = args[0];
      const content = args.slice(1).join(" ");
      if (ethers.isAddress(recipient)) {
        await sendMessage(content, recipient);
      } else {
        console.log("Địa chỉ người nhận không hợp lệ!");
      }
    } else if (command.toLowerCase() === "get" && args.length === 1) {
      const recipient = args[0];
      if (ethers.isAddress(recipient)) {
        await getMessages(recipient);
      } else {
        console.log("Địa chỉ người nhận không hợp lệ!");
      }
    } else {
      console.log('Sử dụng: "send <địa chỉ> <tin nhắn>" hoặc "get <địa chỉ>"');
    }
    startChat();
  });
}

chatContract.on("MessageSent", (sender, content, timestamp, recipient) => {
  if (sender === wallet.address || recipient === wallet.address) {
    const senderLabel = sender === wallet.address ? "Bạn" : sender;
    const timestampInMs = Number(timestamp) * 1000; // Chuyển BigInt sang number
    console.log(`\nTin nhắn mới: [${new Date(timestampInMs).toLocaleString()}] ${senderLabel} -> ${recipient}: ${content}`);
    if (isImageUrl(content)) {
      console.log(`   (Hình ảnh: ${content})`);
    }
  }
});

console.log(`Chat app chạy với tài khoản: ${wallet.address}`);
startChat();