var DeconetAdHocPaymentsSplitting = artifacts.require('./DeconetAdHocPaymentsSplitting.sol')

module.exports = async (deployer, network, accounts) => {

  let kyberNetworkInterface = ''
  if (network == 'ropsten-fork' || network == 'ropsten'){
    kyberNetworkInterface = '0x818E6FECD516Ecc3849DAf6845e3EC868087B755'
  } else if (network == 'mainnet' || network == 'mainnet-fork') {
    kyberNetworkInterface = '0x818E6FECD516Ecc3849DAf6845e3EC868087B755'
  }

  console.log('Deploying DeconetAdHocPaymentsSplitting contract.  Network: ',network)
  await deployer.deploy(DeconetAdHocPaymentsSplitting, kyberNetworkInterface)
  await DeconetAdHocPaymentsSplitting.at(DeconetAdHocPaymentsSplitting.address)


}
