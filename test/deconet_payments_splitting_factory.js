var BigNumber = require("bignumber.js")
var DeconetPaymentsSplittingFactory = artifacts.require("./DeconetPaymentsSplittingFactory.sol")
var DeconetPaymentsSplitting = artifacts.require("./DeconetPaymentsSplitting.sol")

contract("DeconetPaymentsSplittingFactory", async (accounts) => {
  it("should save provided library address during the contract deployment.", async () => {
    let test = async (libraryAddress) => {
      let factory = await DeconetPaymentsSplittingFactory.new(libraryAddress, {from: accounts[0], gasPrice: 1})
      let libAddress = await factory.libraryAddress.call({from: accounts[0], gasPrice: 1})
      expect(libAddress).to.be.equal(libraryAddress)
    }
    test(accounts[1])
    test(accounts[2])
    test(accounts[3])
    test("0x0000000000000000000000000000000000000000")
  })

  it("should create PaymentsSplitting clone successfully, initialize it, and emit the event.", async () => {
    let contract = await DeconetPaymentsSplitting.deployed()
    let factory = await DeconetPaymentsSplittingFactory.new(contract.address, {from: accounts[0], gasPrice: 1})
    let newCloneTxn = await factory.createPaymentsSplitting(
      [accounts[1]],
      [100],
      0,
      {from: accounts[8], gasPrice: 1}
    )
    expect(newCloneTxn.logs[0].event).to.be.equal("PaymentsSplittingCreated")
    let newClone = await DeconetPaymentsSplitting.at(newCloneTxn.logs[0].args.newCloneAddress)
    let distributionDestination = await newClone.distributions.call(0)
    expect(distributionDestination[0]).to.be.equal(accounts[1])
    expect(distributionDestination[1].toNumber()).to.be.equal(100)
    let exponent = await newClone.sharesExponent.call()
    expect(exponent.toNumber()).to.be.equal(0)
  })
})
