var DeconetAdHocPaymentsSplitting = artifacts.require('./DeconetAdHocPaymentsSplitting.sol')

module.exports = async (deployer, network, accounts) => {

  console.log('Deploying DeconetAdHocPaymentsSplitting contract.')
  await deployer.deploy(DeconetAdHocPaymentsSplitting)
  await DeconetAdHocPaymentsSplitting.at(DeconetAdHocPaymentsSplitting.address)


}
