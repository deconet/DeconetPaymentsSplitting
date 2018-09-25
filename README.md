# Deconet Payments Splitting contract

The solution aims to provide an efficient way of accepting donations or payments and split them by some rules and between certain addresses.

Every distribution is the DeconetPaymentsSplitting contract clone. It is immutable by its nature and set up is done only once, so please be really careful while setting up the new clone.

The main DeconetPaymentsSplitting contract can accept incoming funds and distribute between destinations right away from within the payable fallback method. Also, sending party can specify the amount of gas for a transaction, in that case, the contract checks if there is not enough gas sent and if so it skips sending out money and holds crypto in the contract balance. 

The full contract balance gets distributed every time when new funds land and if there is enough gas to perform the operation. Additionally, somebody can call `withdrawFullContractBalance` method specifically and distribute all available funds between addressees.

Gas consumption statistics for the fallback implementation:
- No distribution fix price – **22965**
- 1 destination – **34339**
- 2 destinations – **44573**
- 3 destinations – **54807**
- 4 destinations – **65041**
- 5 destinations – **75275**

Gas consumption for the `withdrawFullContractBalance` method:

- No money sent out(because there were not enough gas) – **21831**
- 1 destination – **32821**
- 2 destinations – **43055**
- 3 destinations – **53289**
- 4 destinations – **63523**
- 5 destinations – **73757**
