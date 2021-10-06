require('@nomiclabs/hardhat-ethers');

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  networks: {
    hardhat: {
      forking: {
        url: 'https://mainnet-eth.compound.finance/',
      }
    },
    mainnet: {
      url: 'https://mainnet-eth.compound.finance',
    }
  },
  solidity: {
    version: '0.5.16',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      }
    }
  }
};
