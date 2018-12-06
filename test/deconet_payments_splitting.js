var BigNumber = require("bignumber.js")
var DeconetPaymentsSplitting = artifacts.require('./DeconetPaymentsSplitting.sol')
var DeconetPaymentsSplittingFactory = artifacts.require('./DeconetPaymentsSplittingFactory.sol')

class FundsOperationEvent {
  constructor(eventJson) {
    this.senderOrAddressee = eventJson.args.senderOrAddressee
    this.amount = eventJson.args.amount
    this.operationType = eventJson.args.operationType
    this.eventName = eventJson.event
  }

  validate(name, senderOrAddressee, amount, operationType) {
    expect(this.eventName).to.be.equal(name)
    expect(this.senderOrAddressee).to.be.equal(senderOrAddressee)
    expect(this.amount.toString()).to.be.equal(amount.toString())
    expect(this.operationType.toNumber()).to.be.equal(operationType.toNumber())
  }
}


contract("DeconetPaymentsSplitting", async (accounts) => {
  let paymentsSplitting

  const ValidateEvent = (senderOrAddressee, amount, operationType) => {
    expect()
  }

  beforeEach (async () => {
    paymentsSplitting = await DeconetPaymentsSplitting.new({from: accounts[0], gasPrice: 1})
  })

  it("should set up distribution correctly for the newly deployed contract.", async () => {
    let setUpAndCheckState = async (destinationAddresses, destinationsMantissaOfShare, sharesExponent) => {
      let txn = await paymentsSplitting.setUpDistribution(
        destinationAddresses,
        destinationsMantissaOfShare,
        sharesExponent,
        {from: accounts[0], gasPrice: 1}
      )

      for (var i = 0; i < destinationAddresses.length; i++) {
        let actualDistribution = await paymentsSplitting.distributions.call(i)
        expect(actualDistribution[0]).to.be.equal(destinationAddresses[i])
        expect(actualDistribution[1].toNumber()).to.be.equal(destinationsMantissaOfShare[i])
      }
      let actualSharesExponent = await paymentsSplitting.sharesExponent.call()
      expect(actualSharesExponent.toNumber()).to.be.equal(sharesExponent)
      expect(txn.logs).to.have.lengthOf(1)
      let emittedEvent = txn.logs[0]
      expect(emittedEvent.event).to.be.equal("DistributionCreated")
      expect(emittedEvent.args.destinations).to.have.ordered.members(destinationAddresses)
      expect(emittedEvent.args.sharesMantissa.map(x => x.toNumber())).to.have.ordered.members(
        destinationsMantissaOfShare
      )
      expect(emittedEvent.args.sharesExponent.toNumber()).to.be.equal(sharesExponent)
      paymentsSplitting = await DeconetPaymentsSplitting.new({from: accounts[0], gasPrice: 1})
    }
    await setUpAndCheckState([accounts[1], accounts[2], accounts[3], accounts[4]], [3900, 3300, 2155, 645], 2)
    await setUpAndCheckState(
      [accounts[1], accounts[2], accounts[3], accounts[4]],
      [39000, 33000, 21549, 6451],
      3
    )
    await setUpAndCheckState(
      [accounts[1], accounts[2], accounts[3]],
      [39, 33, 28],
      0
    )
    await setUpAndCheckState(
      [accounts[1], accounts[2], accounts[3], accounts[4], accounts[5]],
      [390, 330, 120, 135, 25],
      1
    )
  })

  it("should fail setting up distribution for the newly deployed contract with invalid shares.", async () => {
    let setUpAndCheckState = async (destinationAddresses, destinationsMantissaOfShare, sharesExponent) => {
      await paymentsSplitting.setUpDistribution(
        destinationAddresses,
        destinationsMantissaOfShare,
        sharesExponent,
        {from: accounts[0], gasPrice: 1}
      ).catch(async (err) => {
        assert.isOk(err, "Expected fail.")
        let actualDistributionLength = await paymentsSplitting.distributionsLength()
        expect(actualDistributionLength.toString()).to.be.equal('0')
        let actualSharesExponent = await paymentsSplitting.sharesExponent.call()
        expect(actualSharesExponent.toNumber()).to.be.equal(0)
      }).then(async (txn) => {
        if(txn) {
          assert.fail("Should have failed above.")
        }
      })
    }
    await setUpAndCheckState(
      [accounts[1], accounts[2], accounts[3], accounts[4]],
      [3900, 3300, 2155, 745],
      2
    )

    await setUpAndCheckState(
      [accounts[1], accounts[2], accounts[3], accounts[4]],
      [3900, 3300, 2155, 745],
      1
    )

    await setUpAndCheckState(
      [accounts[1], accounts[2]],
      [2155, 745],
      2
    )

    await setUpAndCheckState(
      [accounts[1], accounts[2]],
      [2155, 9145],
      3
    )

    await setUpAndCheckState(
      [accounts[1]],
      [2155, 9145],
      2
    )

    await setUpAndCheckState(
      [],
      [2155, 9145],
      2
    )
  })

  it("should fail setting up splitter contract if it has already been initialized", async () => {
      await paymentsSplitting.setUpDistribution(
        [accounts[1], accounts[2]],
        [40, 60],
        0,
        {from: accounts[0], gasPrice: 1}
      )

      await paymentsSplitting.setUpDistribution(
        [accounts[1], accounts[2]],
        [40, 60],
        0,
        {from: accounts[0], gasPrice: 1}
      ).catch(async (err) => {
        assert.isOk(err, "Expected crash.")
        expect(err.receipt.logs).to.have.lengthOf(0)
      }).then((txn) => {
        if(txn) {
          assert.fail("Should have failed above.")
        }
      })

  })

  it("should fail setting up distribution with >8 destinations for the newly deployed contract.", async () => {
    let setUpAndCheckState = async (destinationAddresses, destinationsMantissaOfShare, sharesExponent) => {
      await paymentsSplitting.setUpDistribution(
        destinationAddresses,
        destinationsMantissaOfShare,
        sharesExponent,
        {from: accounts[0], gasPrice: 1}
      ).catch(async (err) => {
        assert.isOk(err, "Expected fail.")
        let actualDistributionLength = await paymentsSplitting.distributionsLength()
        expect(actualDistributionLength.toString()).to.be.equal('0')
        let sharesExponent = await paymentsSplitting.sharesExponent.call()
        expect(sharesExponent.toNumber()).to.be.equal(0)
      }).then(async (txn) => {
        if(txn) {
          assert.fail("Should have failed above.")
        }
      })
    }

    await setUpAndCheckState(
      [accounts[1], accounts[2], accounts[3], accounts[4], accounts[5], accounts[6], accounts[7], accounts[8], accounts[9]],
      [39000, 31000, 21550, 6450, 1001, 909],
      2
    )

    await setUpAndCheckState(
      [accounts[1], accounts[2], accounts[3], accounts[4], accounts[5], accounts[6], accounts[7], accounts[8], accounts[9], accounts[10], accounts[11]],
      [39000, 11000, 20000, 21550, 6450, 1001, 909],
      2
    )
  })

  it("should accept incoming payments and send funds over to destinations in distribution", async () => {
    let setUpTopUpAndCheckState = async (
      destinationAddresses,
      destinationsMantissaOfShare,
      sharesExponent,
      amountToSendInEth
    ) => {
      await paymentsSplitting.setUpDistribution(
        destinationAddresses,
        destinationsMantissaOfShare,
        sharesExponent,
        {from: accounts[0], gasPrice: 1}
      )

      var amountInWei = web3.utils.toWei(amountToSendInEth.toString())
      var initialBalance = await web3.eth.getBalance(paymentsSplitting.address)
      var initialDestinationBalances = {}
      for (var i = 0; i < destinationAddresses.length; i++) {
        initialDestinationBalances[destinationAddresses[i]] = new BigNumber(await web3.eth.getBalance(destinationAddresses[i]))
      }
      var txn = await paymentsSplitting.sendTransaction({from: accounts[0], gasPrice: 1, value: amountInWei})
      var actualBalance = await web3.eth.getBalance(paymentsSplitting.address)

      expect(txn.logs).to.have.lengthOf(destinationAddresses.length + 1)

      var incomingTxnEvent = new FundsOperationEvent(txn.logs[0])
      incomingTxnEvent.validate("FundsOperation", accounts[0], new BigNumber(amountInWei), new BigNumber(0))
      for (var i = 0; i < destinationAddresses.length; i++) {
        actualBalanceOfDestination = await web3.eth.getBalance(destinationAddresses[i])
        expectedSentAmount = (new BigNumber(amountInWei))
          .times(new BigNumber(destinationsMantissaOfShare[i]))
          .div((new BigNumber(10)).pow(sharesExponent + 2))
        expect(actualBalanceOfDestination.toString()).to.be.equal(
          initialDestinationBalances[destinationAddresses[i]].plus(expectedSentAmount).toString(10)
        )

        var event = new FundsOperationEvent(txn.logs[i + 1])
        event.validate("FundsOperation", destinationAddresses[i], expectedSentAmount, new BigNumber(1))

      }

      expect(actualBalance.toString()).to.be.equal(initialBalance.toString())
      paymentsSplitting = await DeconetPaymentsSplitting.new({from: accounts[0], gasPrice: 1})
    }
    await setUpTopUpAndCheckState(
      [accounts[1], accounts[2], accounts[3], accounts[4]],
      [3900, 3300, 2155, 645],
      2,
      0.2
    )
    await setUpTopUpAndCheckState(
      [accounts[1], accounts[2], accounts[3], accounts[4]],
      [39000, 33000, 21549, 6451],
      3,
      0.1
    )
    await setUpTopUpAndCheckState(
      [accounts[1], accounts[2], accounts[3]],
      [39, 33, 28],
      0,
      0.01
    )
    await setUpTopUpAndCheckState(
      [accounts[1], accounts[2], accounts[3], accounts[4], accounts[5]],
      [390, 330, 120, 135, 25],
      1,
      0.004
    )
  })

  it("should fail accepting incoming payments if amount is lower than needed amount for doing math", async () => {
    let setUpTopUpAndCheckState = async (
      destinationAddresses,
      destinationsMantissaOfShare,
      sharesExponent,
      amountToSendInWei
    ) => {
      await paymentsSplitting.setUpDistribution(
        destinationAddresses,
        destinationsMantissaOfShare,
        sharesExponent,
        {from: accounts[0], gasPrice: 1}
      )

      var initialBalance = await web3.eth.getBalance(paymentsSplitting.address)
      var initialDestinationBalances = {}
      for (var i = 0; i < destinationAddresses.length; i++) {
        initialDestinationBalances[destinationAddresses[i]] = await web3.eth.getBalance(destinationAddresses[i])
      }
      await paymentsSplitting.sendTransaction({from: accounts[0], gasPrice: 1, value: amountToSendInWei})
        .catch(async (err) => {
          assert.isOk(err, "Expected crash.")
          expect(err.receipt.logs).to.have.lengthOf(0)
          var actualBalance = await web3.eth.getBalance(paymentsSplitting.address)
          for (var i = 0; i < destinationAddresses.length; i++) {
            actualBalanceOfDestination = await web3.eth.getBalance(destinationAddresses[i])
            expect(actualBalanceOfDestination.toString()).to.be.equal(
              initialDestinationBalances[destinationAddresses[i]].toString()
            )
          }
          expect(actualBalance.toString()).to.be.equal(initialBalance.toString())
        }).then((txn) => {
          if(txn) {
            assert.fail("Should have failed above.")
          }
        })
      paymentsSplitting = await DeconetPaymentsSplitting.new({from: accounts[0], gasPrice: 1})
    }
    await setUpTopUpAndCheckState(
      [accounts[1], accounts[2], accounts[3], accounts[4]],
      [3900, 3300, 2155, 645],
      2,
      2000
    )
    await setUpTopUpAndCheckState(
      [accounts[1], accounts[2], accounts[3], accounts[4]],
      [39000, 33000, 21549, 6451],
      3,
      10000
    )
    await setUpTopUpAndCheckState(
      [accounts[1], accounts[2], accounts[3]],
      [39, 33, 28],
      0,
      99
    )
    await setUpTopUpAndCheckState(
      [accounts[1], accounts[2], accounts[3], accounts[4], accounts[5]],
      [390, 330, 120, 135, 25],
      1,
      999
    )
  })

  it("should prevent setting a contract address as a destination", async () => {
    var factoryContract = await DeconetPaymentsSplittingFactory.deployed()
    var invalidDestinationAddress = factoryContract.address

    let setUpDistributionAndCheckSuccess = async (
      destinationAddresses,
      destinationsMantissaOfShare,
      sharesExponent,
      shouldCreateException
    ) => {
      await paymentsSplitting.setUpDistribution(
        destinationAddresses,
        destinationsMantissaOfShare,
        sharesExponent,
        {from: accounts[0], gasPrice: 1}
      ).catch(async (err) => {
        if (!shouldCreateException) {
          assert.fail("Unexpected exception.")
        }
        assert.isOk(err, "Expected exception.")
      }).then(async (txn) => {
        if(txn) {
          if (shouldCreateException) {
            assert.fail("Should have failed above.")
          }
        }
      })

      paymentsSplitting = await DeconetPaymentsSplitting.new({from: accounts[0], gasPrice: 1})
    }

    await setUpDistributionAndCheckSuccess(
      [invalidDestinationAddress, accounts[2], accounts[3], accounts[4]],
      [3900, 3300, 2155, 645],
      2,
      true
    )
    await setUpDistributionAndCheckSuccess(
      [accounts[1], accounts[2], invalidDestinationAddress, invalidDestinationAddress],
      [39000, 33000, 21549, 6451],
      3,
      true
    )
    await setUpDistributionAndCheckSuccess(
      [accounts[1], accounts[2], accounts[3]],
      [39, 33, 28],
      0,
      false
    )
    await setUpDistributionAndCheckSuccess(
      [accounts[1], invalidDestinationAddress, accounts[3]],
      [39, 33, 28],
      0,
      true
    )
    await setUpDistributionAndCheckSuccess(
      [invalidDestinationAddress, invalidDestinationAddress, invalidDestinationAddress],
      [39, 33, 28],
      0,
      true
    )
    await setUpDistributionAndCheckSuccess(
      [accounts[1], accounts[2], accounts[3], accounts[4], invalidDestinationAddress],
      [390, 330, 120, 135, 25],
      1,
      true
    )
  })

  it("tests gas usage of distributions' transfers via fallback.", async () => {
    let setUpTopUpAndCheckState = async (
      destinationAddresses,
      destinationsMantissaOfShare,
      sharesExponent,
      amountToSendInEth,
      gas,
      shouldCreateException
    ) => {
      await paymentsSplitting.setUpDistribution(
        destinationAddresses,
        destinationsMantissaOfShare,
        sharesExponent,
        {from: accounts[0], gasPrice: 1}
      )

      var amountInWei = web3.utils.toWei(amountToSendInEth.toString())
      var txnSendingDict = {from: accounts[0], gasPrice: 1, value: amountInWei}
      if(gas) {
        txnSendingDict["gas"] = gas
      }

      await paymentsSplitting.sendTransaction(txnSendingDict).catch(async (err) => {
        if (!shouldCreateException) {
          assert.fail("Unexpected exception.")
        }
        assert.isOk(err, "Expected exception.")
      }).then(async (txn) => {
        if(txn) {
          if (shouldCreateException) {
            assert.fail("Should have failed above.")
          }
        }
      })

      paymentsSplitting = await DeconetPaymentsSplitting.new({from: accounts[0], gasPrice: 1})
    }
    await setUpTopUpAndCheckState(
      [accounts[10]],
      [10000],
      2,
      0.0002,
      null,
      false
    )
    await setUpTopUpAndCheckState(
      [accounts[1], accounts[2]],
      [5000, 5000],
      2,
      0.2,
      null,
      false
    )
    await setUpTopUpAndCheckState(
      [accounts[1], accounts[2], accounts[3]],
      [39, 33, 28],
      0,
      0.01,
      null,
      false
    )
    await setUpTopUpAndCheckState(
      [accounts[1], accounts[2], accounts[3], accounts[4]],
      [39000, 33000, 21549, 6451],
      3,
      0.1,
      null,
      false
    )
    await setUpTopUpAndCheckState(
      [accounts[1], accounts[2], accounts[3], accounts[4], accounts[5]],
      [390, 330, 120, 135, 25],
      1,
      0.004,
      null,
      false
    )
    await setUpTopUpAndCheckState(
      [accounts[1], accounts[2], accounts[3], accounts[4]],
      [390, 330, 120, 160],
      1,
      0.004,
      200000,
      false
    )
    await setUpTopUpAndCheckState(
      [accounts[10]],
      [10000],
      2,
      0.0002,
      25000,
      true
    )
    await setUpTopUpAndCheckState(
      [accounts[1], accounts[2]],
      [5000, 5000],
      2,
      0.2,
      25000,
      true
    )
    await setUpTopUpAndCheckState(
      [accounts[1], accounts[2], accounts[3], accounts[4], accounts[5]],
      [390, 330, 120, 135, 25],
      1,
      0.004,
      30000,
      true
    )
  })
})

