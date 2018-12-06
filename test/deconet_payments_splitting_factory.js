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

  it("should successfully update library address with a valid address from the owner address.", async () => {
    let updateAddress = async (libraryAddress, newLibraryAddress) => {
      let factory = await DeconetPaymentsSplittingFactory.new(libraryAddress, {from: accounts[0], gasPrice: 1})
      await factory.setLibraryAddress(newLibraryAddress, {from: accounts[0], gasPrice: 1})
      return factory.libraryAddress.call()
    }
    let newAddress = await updateAddress(accounts[1], accounts[2])
    expect(newAddress).to.be.equal(accounts[2])
    newAddress = await updateAddress(accounts[2], accounts[3])
    expect(newAddress).to.be.equal(accounts[3])
  })

  it("should fail to update library address with the same address.", async () => {
    let factory = await DeconetPaymentsSplittingFactory.new(accounts[1], {from: accounts[0], gasPrice: 1})
    await factory.setLibraryAddress(
      accounts[1],
      {from: accounts[0], gasPrice: 1}
    ).catch(async (err) => {
      assert.isOk(err, "Should throw exception here.")
      let libAddress = await factory.libraryAddress.call()
      expect(libAddress).to.be.equal(accounts[1])
    }).then((txn) => {
      if(txn) {
        assert.fail(txn, "Should have failed above.")
      }
    })
  })

  it("should fail to update library address from not the owner address.", async () => {
    let factory = await DeconetPaymentsSplittingFactory.new(accounts[1], {from: accounts[0], gasPrice: 1})
    await factory.setLibraryAddress(
      accounts[3],
      {from: accounts[2], gasPrice: 1} // owner address is not correct.
    ).catch(async (err) => {
      assert.isOk(err, "Should throw exception here.")
      let libAddress = await factory.libraryAddress.call()
      expect(libAddress).to.be.equal(accounts[1])
    }).then((txn) => {
      if(txn) {
        assert.fail(txn, "Should have failed above.")
      }
    })
  })

  it("should fail to update library address with 0x0 contract address.", async () => {
    let factory = await DeconetPaymentsSplittingFactory.new(accounts[1], {from: accounts[0], gasPrice: 1})
    await factory.setLibraryAddress(
      "0x0",
      {from: accounts[0], gasPrice: 1}
    ).catch(async (err) => {
      assert.isOk(err, "Should throw exception here.")
      let libAddress = await factory.libraryAddress.call()
      expect(libAddress).to.be.equal(accounts[1])
    }).then((txn) => {
      if(txn) {
        assert.fail(txn, "Should have failed above.")
      }
    })
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
