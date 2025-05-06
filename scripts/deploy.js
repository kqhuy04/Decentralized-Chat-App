const hre = require("hardhat");

async function main() {
  // Get the Chat contract factory
  const Chat = await hre.ethers.getContractFactory("Chat");
  
  // Deploy the contract
  const chat = await Chat.deploy();
  
  // Wait for deployment to complete
  await chat.waitForDeployment();
  
  console.log("Chat contract deployed to:", chat.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});