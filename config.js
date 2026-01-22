// config.js
window.APP_CONFIG = {
  CHAIN_ID_DEC: 56,
  CHAIN_ID_HEX: "0x38",

  // Tokens
  USDT: "0x55d398326f99059fF775485246999027B3197955",
  DF:   "0x36579d7eC4b29e875E3eC21A55F71C822E03A992",

  // Contracts (V3)
  CORE:   "0x2e119DdcFF87765FF3A525d74F40514Fb78b5DFC",
  VAULT:  "0xf3B240c4441C4816dd2b55Ab417e7A50aD29a8F9",
  STAKING:"0x8c7b90CFaC3bA481059cCE74f73407bB29D2969d",
  PAYOUT: "0xB0eE07973957ED3Ea2C854b7b7c664F85FDFdBF0",
  BINARY: "0x822F063D6c5246354D4c146e77C9b4aE1A15563c",

  // Minimal ERC20 ABI
  ERC20_ABI: [
    "function balanceOf(address) view returns (uint256)",
    "function decimals() view returns (uint8)"
  ],

  // CoreV3 minimal ABI
  CORE_ABI: [
    "function owner() view returns (address)",
    "function treasury() view returns (address)",
    "function setTreasury(address t) external",
    "function transferOwnership(address n) external"
  ],

  // VaultV3 minimal ABI
  VAULT_ABI: [
    "function owner() view returns (address)",
    "function surplusUSDT() view returns (uint256)",
    "function totalClaimableUSDT() view returns (uint256)",
    "function totalClaimableDF() view returns (uint256)",
    "function withdrawSurplusUSDT(address to, uint256 amount) external",
    "function transferOwnership(address n) external"
  ],

  // StakingV3 minimal ABI
  STAKING_ABI: [
    "function owner() view returns (address)",
    "function ownerWithdrawDF(address to, uint256 amount) external",
    "function transferOwnership(address n) external"
  ]
};
