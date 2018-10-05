# Deconet Payments Splitting contract

The solution aims to provide an efficient way of accepting donations or payments and split them by some rules and between certain addresses.

The idea is to help devs capture long term value from a project they work on, instead of being paid hourly or per-project.  An example would be if someone asked you to build a FOMO3D type contract, and offered 10% of the profits of the contract forever.  You could deploy this payment splitting contract to pay 10% to an address you control and 90% to the client asking you to build this.  Then specify this deployed payment splitting contract address as the payout address in the FOMO3D contract.

We would love peer review, improvements, suggestions, and more.  Imagine if this contract automatically split based on ERC20 holding percentages!

# How it works

Every distribution is the DeconetPaymentsSplitting contract clone. It is immutable by its nature and set up is done only once, so please be really careful while setting up the new clone.

The main DeconetPaymentsSplitting contract can accept incoming funds and distribute between destinations right away from within the payable fallback method. Also, sending party can specify the amount of gas for a transaction, in that case, the contract checks if there is not enough gas sent and if so it skips sending out money and holds crypto in the contract balance.

The full contract balance gets distributed every time when new funds land and if there is enough gas to perform the operation. Additionally, somebody can call `withdrawFullContractBalance` method specifically and distribute all available funds between addressees.

Gas consumption statistics for the fallback implementation:
- No distribution fix price – **23151**
- 1 destination – **34717**
- 2 destinations – **45143**
- 3 destinations – **55569**
- 4 destinations – **65995**
- 5 destinations – **76421**

Gas consumption for the `withdrawFullContractBalance` method:

- No money sent out(because there were not enough gas) – **21831**
- 1 destination – **33007**
- 2 destinations – **43433**
- 3 destinations – **53859**
- 4 destinations – **64285**
- 5 destinations – **74711**
