require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.19",
  networks: {
    hardhat: {
      chainId: 31337, // Mặc định của hardhat node
    },
  },
};