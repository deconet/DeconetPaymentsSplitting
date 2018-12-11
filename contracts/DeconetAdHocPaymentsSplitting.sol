pragma solidity 0.4.25;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";


/**
 * @title Payments Splitting contract.
 *
 * @dev Contract for companies or groups of people who wants to accept Ethereum donations or payments and
 * distribution funds by preconfigured rules.
 */
contract DeconetAdHocPaymentsSplitting {
    using SafeMath for uint;

    // Logged when funds go out
    event FundsOut (
        uint amount,
        address destination,
        uint sharesMantissa,
        uint sharesExponent
    );

    // Logged when funds come in
    event FundsIn (
        uint amount,
        string memo
    );


    /**
     * @dev Disabled fallback payable function
     */
    function () public payable {
        revert(); // disable fallback function
    }

    /**
     * @dev Send funds to destinations
     * @param _destinations Destination addresses of the current payment.
     * @param _sharesMantissa Mantissa values for destinations shares ordered respectively with `_destinations`.
     * @param _sharesExponent Exponent of a power term that forms shares floating-point numbers, expected to
     * be the same for all values in `_sharesMantissa`.
     * @param _memo A string memo
     */
    function sendFunds(
        address[] _destinations,
        uint[] _sharesMantissa,
        uint _sharesExponent,
        string _memo
    )
        public payable
    {
        require(_destinations.length <= 8 && _destinations.length > 0, "There is a maximum of 8 destinations allowed");  // max of 8 destinations
        // prevent integer overflow when math with _sharesExponent happens
        // also ensures that low balances can be distributed because balance must always be >= 10**(sharesExponent + 2)
        require(_sharesExponent <= 4, "The maximum allowed sharesExponent is 4");
        // ensure that lengths of arrays match so array out of bounds can't happen
        require(_destinations.length == _sharesMantissa.length, "Length of destinations does not match length of sharesMantissa");

        uint balance = msg.value;
        require(balance >= 10**(_sharesExponent.add(2)), "You can not split up less wei than the sum of all shares");
        emit FundsIn(balance, _memo);

        // ensure everything sums correctly to 100%
        uint sum = 0;

        // loop over destinations and send out funds
        for (uint i = 0; i < _destinations.length; i++) {
            sum = sum.add(_sharesMantissa[i]);
            address destination = _destinations[i];
            uint mantissa = _sharesMantissa[i];
            uint amount = calculatePayout(balance, mantissa, _sharesExponent);
            destination.transfer(amount);
            emit FundsOut(amount, destination, mantissa, _sharesExponent);
        }
        // taking into account 100% by adding 2 to the exponent.  Note that if this fails, the whole txn will revert and funds will be refunded.
        require(sum == 10**(_sharesExponent.add(2)), "The sum of all sharesMantissa should equal 10 ** ( _sharesExponent + 2 ) but it does not.");
    }

    /**
     * @dev Calculates a share of the full amount.
     * @param _fullAmount Full amount.
     * @param _shareMantissa Mantissa of the percentage floating-point number.
     * @param _shareExponent Exponent of the percentage floating-point number.
     * @return An uint of the payout.
     */
    function calculatePayout(uint _fullAmount, uint _shareMantissa, uint _shareExponent) private pure returns(uint) {
        return (_fullAmount.div(10 ** (_shareExponent.add(2)))).mul(_shareMantissa);
    }
}
