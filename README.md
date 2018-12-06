# Deconet Payments Splitting contract

The solution aims to provide an efficient way of accepting donations or payments and split them by some rules and between certain addresses.

The idea is to help devs capture long term value from a project they work on, instead of being paid hourly or per-project.  An example would be if someone asked you to build a FOMO3D type contract, and offered 10% of the profits of the contract forever.  You could deploy this payment splitting contract to pay 10% to an address you control and 90% to the client asking you to build this.  Then specify this deployed payment splitting contract address as the payout address in the FOMO3D contract.

We would love peer review, improvements, suggestions, and more.  Imagine if this contract automatically split based on ERC20 holding percentages!

# How it works

Every distribution is the DeconetPaymentsSplitting contract clone. It is immutable by its nature and set up is done only once, so please be really careful while setting up the new clone.

The main DeconetPaymentsSplitting contract can accept incoming funds and distribute between destinations right away from within the payable fallback method.

The full contract balance gets distributed every time when new funds land.