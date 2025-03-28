const hre = require("hardhat");

async function main() {
  // Lấy factory của hợp đồng Chat
  const Chat = await hre.ethers.getContractFactory("Chat");
  
  // Triển khai hợp đồng
  const chat = await Chat.deploy();
  
  // Không cần gọi deployed() nữa, nhưng có thể chờ giao dịch hoàn tất nếu muốn
  await chat.waitForDeployment(); // Thay vì chat.deployed()
  
  console.log("Chat contract deployed to:", chat.target); // Thay vì chat.address
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});