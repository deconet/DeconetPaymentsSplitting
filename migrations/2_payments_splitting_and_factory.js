var DeconetPaymentsSplitting = artifacts.require('./DeconetPaymentsSplitting.sol')
var DeconetPaymentsSplittingFactory = artifacts.require('./DeconetPaymentsSplittingFactory.sol')

module.exports = async (deployer, network, accounts) => {
  let deconetPaymentsSplitting, deconetPaymentsSplittingFactory

  console.log('Deploying DeconetPaymentsSplitting contract.')
  await deployer.deploy(DeconetPaymentsSplitting)
  deconetPaymentsSplitting = await DeconetPaymentsSplitting.at(DeconetPaymentsSplitting.address)
  deployer.link(DeconetPaymentsSplitting, DeconetPaymentsSplittingFactory)

  console.log('Deploying DeconetPaymentsSplittingFactory contract.')
  await deployer.deploy(DeconetPaymentsSplittingFactory, deconetPaymentsSplitting.address)
  deconetPaymentsSplittingFactory = await DeconetPaymentsSplittingFactory.at(DeconetPaymentsSplittingFactory.address)
}
