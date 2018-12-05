module.exports = {
  accounts: 20,
  port: 8997,
  testrpcOptions: '--accounts 20 -e 1000 --port 8997 -i 99 --noVMErrorsOnRPCResponse true',
  // norpc: true,
  copyPackages: ['zeppelin-solidity'],
  skipFiles: [
    'Migrations.sol',
    'mocks/'
  ]
};
