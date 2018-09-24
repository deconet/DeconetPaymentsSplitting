var BigNumber = require("bignumber.js")
var DeconetPaymentsSplitting = artifacts.require('./DeconetPaymentsSplitting.sol')

contract("DeconetPaymentsSplitting", async (accounts) => {
  let paymentsSplitting

  beforeEach (async () => {
    paymentsSplitting = await DeconetPaymentsSplitting.new({from: accounts[0], gasPrice: 1})
  })

  it("should set up distribution correctly for the newly deployed contract.", async () => {
    let setUpAndCheckState = async (destinationAddresses, destinationsMantissaOfShare, sharesExponent) => {
      await paymentsSplitting.setUpDistribution(
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
      for (var i = 0; i < destinationAddresses.length; i++) {
        actualBalanceOfDestination = await web3.eth.getBalance(destinationAddresses[i])
        expectedSentAmount = (new BigNumber(amountInWei))
          .times(new BigNumber(destinationsMantissaOfShare[i]))
          .div((new BigNumber(10)).pow(sharesExponent + 2))
        expect(actualBalanceOfDestination.toString()).to.be.equal(
          initialDestinationBalances[destinationAddresses[i]].plus(expectedSentAmount).toString()
        )
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
})


