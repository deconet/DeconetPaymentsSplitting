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

      for (var i = 0; i <= destinationAddresses.length; i++) {
        let actualDistribution = await paymentsSplitting.distributions.call(i)
        if(i == destinationAddresses.length) {
          expect(actualDistribution[0]).to.be.equal('0x0')
          expect(actualDistribution[1].toNumber()).to.be.equal(0)
        } else {
          expect(actualDistribution[0]).to.be.equal(destinationAddresses[i])
          expect(actualDistribution[1].toNumber()).to.be.equal(destinationsMantissaOfShare[i])
        }
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
        let actualDistribution = await paymentsSplitting.distributions.call(0)
        expect(actualDistribution[0]).to.be.equal('0x0')
        expect(actualDistribution[1].toNumber()).to.be.equal(0)
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

  it("should fail setting up distribution with >5 destinations for the newly deployed contract.", async () => {
    let setUpAndCheckState = async (destinationAddresses, destinationsMantissaOfShare, sharesExponent) => {
      await paymentsSplitting.setUpDistribution(
        destinationAddresses,
        destinationsMantissaOfShare,
        sharesExponent,
        {from: accounts[0], gasPrice: 1}
      ).catch(async (err) => {
        assert.isOk(err, "Expected fail.")
        let actualDistribution = await paymentsSplitting.distributions.call(0)
        expect(actualDistribution[0]).to.be.equal('0x0')
        expect(actualDistribution[1].toNumber()).to.be.equal(0)
        let sharesExponent = await paymentsSplitting.sharesExponent.call()
        expect(sharesExponent.toNumber()).to.be.equal(0)
      }).then(async (txn) => {
        if(txn) {
          assert.fail("Should have failed above.")
        }
      })
    }

    await setUpAndCheckState(
      [accounts[1], accounts[2], accounts[3], accounts[4], accounts[5], accounts[6]],
      [39000, 31000, 21550, 6450, 1001, 909],
      2
    )

    await setUpAndCheckState(
      [accounts[1], accounts[2], accounts[3], accounts[4], accounts[5], accounts[6], accounts[7]],
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

      var amountInWei = web3.toWei(amountToSendInEth)
      var initialBalance = await web3.eth.getBalance(paymentsSplitting.address)
      var initialDestinationBalances = {}
      for (var i = 0; i < destinationAddresses.length; i++) {
        initialDestinationBalances[destinationAddresses[i]] = await web3.eth.getBalance(destinationAddresses[i])
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
          initialDestinationBalances[destinationAddresses[i]].plus(expectedSentAmount).toString()
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

  it(
    "should accept incoming payments and keep funds in contract balance if there is not enough gas.",
    async () => {
      let setUpTopUpAndCheckState = async (
        destinationAddresses,
        destinationsMantissaOfShare,
        sharesExponent,
        amountToSendInEth,
        gas
      ) => {
        await paymentsSplitting.setUpDistribution(
          destinationAddresses,
          destinationsMantissaOfShare,
          sharesExponent,
          {from: accounts[0], gasPrice: 1}
        )

        var amountInWei = web3.toWei(amountToSendInEth)
        var initialBalance = await web3.eth.getBalance(paymentsSplitting.address)
        var initialDestinationBalances = {}
        for (var i = 0; i < destinationAddresses.length; i++) {
          initialDestinationBalances[destinationAddresses[i]] = await web3.eth.getBalance(destinationAddresses[i])
        }
        var txn = await paymentsSplitting.sendTransaction(
          {from: accounts[0], gasPrice: 1, gas: gas, value: amountInWei}
        )
        expect(txn.logs).to.have.lengthOf(1)
        var incomingTxnEvent = new FundsOperationEvent(txn.logs[0])
        incomingTxnEvent.validate("FundsOperation", accounts[0], new BigNumber(amountInWei), new BigNumber(0))
        var actualBalance = await web3.eth.getBalance(paymentsSplitting.address)
        for (var i = 0; i < destinationAddresses.length; i++) {
          actualBalanceOfDestination = await web3.eth.getBalance(destinationAddresses[i])
          expect(actualBalanceOfDestination.toString()).to.be.equal(
            initialDestinationBalances[destinationAddresses[i]].toString()
          )
        }
        expect(actualBalance.toString()).to.be.equal(initialBalance.plus(amountInWei).toString())
        paymentsSplitting = await DeconetPaymentsSplitting.new({from: accounts[0], gasPrice: 1})
      }
      await setUpTopUpAndCheckState(
        [accounts[1], accounts[2], accounts[3], accounts[4]],
        [3900, 3300, 2155, 645],
        2,
        0.2,
        25500
      )
      await setUpTopUpAndCheckState(
        [accounts[1], accounts[2], accounts[3], accounts[4]],
        [39000, 33000, 21549, 6451],
        3,
        0.1,
        25000
      )
      await setUpTopUpAndCheckState(
        [accounts[1], accounts[2], accounts[3]],
        [39, 33, 28],
        0,
        0.01,
        30000
      )
      await setUpTopUpAndCheckState(
        [accounts[1], accounts[2], accounts[3], accounts[4], accounts[5]],
        [390, 330, 120, 135, 25],
        1,
        0.004,
        35000
      )
    }
  )

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

  it("should process incoming payments as usually if transfering to some address fails.", async () => {
    var factoryContract = await DeconetPaymentsSplittingFactory.deployed()
    var invalidDestinationAddress = factoryContract.address
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
      var txn = await paymentsSplitting.sendTransaction({from: accounts[0], gasPrice: 1, value: amountToSendInWei})
      var actualBalance = await web3.eth.getBalance(paymentsSplitting.address)

      var incomingTxnEvent = new FundsOperationEvent(txn.logs[0])
      incomingTxnEvent.validate("FundsOperation", accounts[0], new BigNumber(amountToSendInWei), new BigNumber(0))
      var eventsIndex = 1
      var resultingLeftInContractBalanceAmount = new BigNumber(0)
      for (var i = 0; i < destinationAddresses.length; i++) {
        actualBalanceOfDestination = await web3.eth.getBalance(destinationAddresses[i])
        expectedSentAmount = (new BigNumber(amountToSendInWei))
          .times(new BigNumber(destinationsMantissaOfShare[i]))
          .div((new BigNumber(10)).pow(sharesExponent + 2))
        if(destinationAddresses[i] == invalidDestinationAddress) {
          expect(actualBalanceOfDestination.toString()).to.be.equal(
            initialDestinationBalances[destinationAddresses[i]].toString()
          )
          resultingLeftInContractBalanceAmount = resultingLeftInContractBalanceAmount.plus(expectedSentAmount)
        } else {
          expect(actualBalanceOfDestination.toString()).to.be.equal(
            initialDestinationBalances[destinationAddresses[i]].plus(expectedSentAmount).toString()
          )

          var event = new FundsOperationEvent(txn.logs[eventsIndex++])
          event.validate("FundsOperation", destinationAddresses[i], expectedSentAmount, new BigNumber(1))
        }
      }

      expect(actualBalance.toString()).to.be.equal(
        initialBalance.plus(resultingLeftInContractBalanceAmount).toString()
      )
      paymentsSplitting = await DeconetPaymentsSplitting.new({from: accounts[0], gasPrice: 1})
    }
    await setUpTopUpAndCheckState(
      [invalidDestinationAddress, accounts[2], accounts[3], accounts[4]],
      [3900, 3300, 2155, 645],
      2,
      20000000
    )
    await setUpTopUpAndCheckState(
      [accounts[1], accounts[2], invalidDestinationAddress, invalidDestinationAddress],
      [39000, 33000, 21549, 6451],
      3,
      100000000
    )
    await setUpTopUpAndCheckState(
      [accounts[1], invalidDestinationAddress, accounts[3]],
      [39, 33, 28],
      0,
      9900000
    )
    await setUpTopUpAndCheckState(
      [accounts[1], invalidDestinationAddress, accounts[3]],
      [39, 33, 28],
      0,
      9900000
    )
    await setUpTopUpAndCheckState(
      [invalidDestinationAddress, invalidDestinationAddress, invalidDestinationAddress],
      [39, 33, 28],
      0,
      9900000
    )
    await setUpTopUpAndCheckState(
      [accounts[1], accounts[2], accounts[3], accounts[4], invalidDestinationAddress],
      [390, 330, 120, 135, 25],
      1,
      999000000
    )
  })

  it("tests gas usage of distributions' transfers via fallback.", async () => {
    let setUpTopUpAndCheckState = async (
      destinationAddresses,
      destinationsMantissaOfShare,
      sharesExponent,
      amountToSendInEth,
      gas
    ) => {
      await paymentsSplitting.setUpDistribution(
        destinationAddresses,
        destinationsMantissaOfShare,
        sharesExponent,
        {from: accounts[0], gasPrice: 1}
      )

      var amountInWei = web3.toWei(amountToSendInEth)
      var txnSendingDict = {from: accounts[0], gasPrice: 1, value: amountInWei}
      if(gas) {
        txnSendingDict["gas"] = gas
      }
      var txn = await paymentsSplitting.sendTransaction(txnSendingDict)
      console.log(`${txn.logs.length == 1 ? "Not distributed" : "Distributed"}. ${destinationAddresses.length} destinations – ${txn.receipt.gasUsed} gas used.`)

      paymentsSplitting = await DeconetPaymentsSplitting.new({from: accounts[0], gasPrice: 1})
    }
    await setUpTopUpAndCheckState(
      [accounts[10]],
      [10000],
      2,
      0.0002
    )
    await setUpTopUpAndCheckState(
      [accounts[1], accounts[2]],
      [5000, 5000],
      2,
      0.2
    )
    await setUpTopUpAndCheckState(
      [accounts[1], accounts[2], accounts[3]],
      [39, 33, 28],
      0,
      0.01
    )
    await setUpTopUpAndCheckState(
      [accounts[1], accounts[2], accounts[3], accounts[4]],
      [39000, 33000, 21549, 6451],
      3,
      0.1
    )
    await setUpTopUpAndCheckState(
      [accounts[1], accounts[2], accounts[3], accounts[4], accounts[5]],
      [390, 330, 120, 135, 25],
      1,
      0.004
    )
    await setUpTopUpAndCheckState(
      [accounts[10]],
      [10000],
      2,
      0.0002,
      25000
    )
    await setUpTopUpAndCheckState(
      [accounts[1], accounts[2]],
      [5000, 5000],
      2,
      0.2,
      25000
    )
    await setUpTopUpAndCheckState(
      [accounts[1], accounts[2], accounts[3], accounts[4], accounts[5]],
      [390, 330, 120, 135, 25],
      1,
      0.004,
      30000
    )
  })

  it("tests gas usage of distributions' transfers via `withdrawFullContractBalance` method.", async () => {
    let setUpTopUpAndCheckState = async (
      destinationAddresses,
      destinationsMantissaOfShare,
      sharesExponent,
      amountToSendInEth,
      gas
    ) => {
      await paymentsSplitting.setUpDistribution(
        destinationAddresses,
        destinationsMantissaOfShare,
        sharesExponent,
        {from: accounts[0], gasPrice: 1}
      )

      var amountInWei = web3.toWei(amountToSendInEth)
      var txnSendingDict = {from: accounts[0], gasPrice: 1, value: amountInWei}
      txnSendingDict["gas"] = 23299
      await paymentsSplitting.sendTransaction(txnSendingDict)
      txnSendingDict = {from: accounts[0], gasPrice: 1}
      if(gas) {
        txnSendingDict["gas"] = gas
      }
      var txn = await paymentsSplitting.withdrawFullContractBalance(txnSendingDict)
      console.log(`${destinationAddresses.length} destinations – ${txn.receipt.gasUsed} gas used.`)

      paymentsSplitting = await DeconetPaymentsSplitting.new({from: accounts[0], gasPrice: 1})
    }
    await setUpTopUpAndCheckState(
      [accounts[10]],
      [10000],
      2,
      0.0002
    )
    await setUpTopUpAndCheckState(
      [accounts[1], accounts[2]],
      [5000, 5000],
      2,
      0.2
    )
    await setUpTopUpAndCheckState(
      [accounts[1], accounts[2], accounts[3]],
      [39, 33, 28],
      0,
      0.01
    )
    await setUpTopUpAndCheckState(
      [accounts[1], accounts[2], accounts[3], accounts[4]],
      [39000, 33000, 21549, 6451],
      3,
      0.1
    )
    await setUpTopUpAndCheckState(
      [accounts[1], accounts[2], accounts[3], accounts[4], accounts[5]],
      [390, 330, 120, 135, 25],
      1,
      0.004
    )
    await setUpTopUpAndCheckState(
      [accounts[10]],
      [10000],
      2,
      0.0002,
      25000
    )
    await setUpTopUpAndCheckState(
      [accounts[1], accounts[2]],
      [5000, 5000],
      2,
      0.2,
      25000
    )
    await setUpTopUpAndCheckState(
      [accounts[1], accounts[2], accounts[3], accounts[4], accounts[5]],
      [390, 330, 120, 135, 25],
      1,
      0.004,
      30000
    )
  })
})

