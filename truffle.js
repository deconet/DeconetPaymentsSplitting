var HDWalletProvider = require('truffle-hdwallet-provider')
const LedgerWalletProvider = require('@deconet/truffle-ledger-provider');

// matching address is 0x648d692e5c507c233d0f9d9fea062429003b3144
let mnemonic = process.env.DECONET_BLOCKCHAIN_ROPSTEN_MNEMONIC

const ledgerOptions = {
  networkId: 1,
  path: "44'/60'/0'/0",
  askConfirm: false,
  accountsLength: 1,
  accountsOffset: 0,
};

module.exports = {
  networks: {
    development: {
      host: '127.0.0.1',
      port: 8545,
      network_id: '*' // Match any network id
    },
    ropsten: {
      provider: function () {
        // return new HDWalletProvider(mnemonic, 'https://ropsten.infura.io/JTdaA5dJvlwfCfdgT5Cm')
        // local GETH which supports debug
        // return new HDWalletProvider(mnemonic, 'http://127.0.0.1:8549')
        // remote GETH
        return new HDWalletProvider(mnemonic, process.env.DECONET_ROPSTEN_NODE_URL)
        // ledger testing
        // return new LedgerWalletProvider(ledgerOptions, "https://ropsten.infura.io/JTdaA5dJvlwfCfdgT5Cm")
      },
      network_id: 3,
      gas: 4700000
    },
    rinkby: {
      provider: function () {
        return new HDWalletProvider(mnemonic, 'https://rinkeby.infura.io/JTdaA5dJvlwfCfdgT5Cm')
      },
      network_id: 4,
      gas: 4700000
    },
    mainnet: {
      provider: function() {
        // return new LedgerWalletProvider(ledgerOptions, 'http://18.208.64.51:8545')
        // return new LedgerWalletProvider(ledgerOptions, "https://rapidly-renewed-buzzard.quiknode.io")
        return new LedgerWalletProvider(ledgerOptions, "https://mainnet.infura.io/JTdaA5dJvlwfCfdgT5Cm")
      },
      network_id: 1,
      gas: 6000000,
      gasPrice: 10000000000 // 10 gwei
    },
    coverage: {
      host: "127.0.0.1",
      network_id: "*",
      port: 8997,
      gas: 0xfffffffffff,
      gasPrice: 0x1
    }
  },
  compilers: {
    solc: {
      version: "0.4.25",
      settings: {
        optimizer: {
          enabled: false,
          runs: 200
        }
      }
    }
  }
}
