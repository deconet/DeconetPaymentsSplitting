pragma solidity 0.4.25;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./Kyber.sol";


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
        ERC20 token,
        uint tokenAmount
    );

    // Logged when funds come in
    event FundsIn (
        uint amount,
        string memo
    );

    // 0x818E6FECD516Ecc3849DAf6845e3EC868087B755 for ropsten
    KyberNetworkProxyInterface internal kyberNetworkProxy;


    // copied from kyber contract
    ERC20 constant internal ETH_TOKEN_ADDRESS = ERC20(0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee);

    constructor(address _kyberNetworkProxyAddress) {
        kyberNetworkProxy = KyberNetworkProxyInterface(_kyberNetworkProxyAddress);
    }

    /**
     * @dev Disabled fallback payable function
     */
    function () public payable {
        revert(); // disable fallback function
    }

    /**
     * @dev Send funds to destinations
     * @param _destinations Destination addresses of the current payment.
     * @param _amounts Amounts for destinations ordered respectively with `_destinations`.
     * @param _outCurrencies Output currencies for every destination and ordered respectively with `_destinations`.
     * @param _memo A string memo.
     */
    function sendFunds(
        address[] _destinations,
        uint[] _amounts,
        ERC20[] _outCurrencies,
        string _memo
    )
        public
        payable
    {
        require(
            _destinations.length <= 8 && _destinations.length > 0,
            "There is a maximum of 8 destinations allowed"
        );  // max of 8 destinations
        // ensure that lengths of arrays match so array out of bounds can't happen
        require(
            _destinations.length == _amounts.length,
            "Length of destinations does not match length of amounts"
        );
        // ensure that lengths of arrays match so array out of bounds can't happen
        require(
            _destinations.length == _outCurrencies.length,
            "Length of destinations does not match length of outCurrencies"
        );

        uint balance = msg.value;
        emit FundsIn(balance, _memo);

        // ensure amounts sum correctly to `balance`.
        uint sum = 0;

        // loop over destinations and send out funds
        for (uint i = 0; i < _destinations.length; i++) {
            address destination = _destinations[i];
            ERC20 outCurrency = _outCurrencies[i];

            uint amount = _amounts[i];
            uint sent = amount;
            if (outCurrency == ETH_TOKEN_ADDRESS) {
                destination.transfer(amount);
            } else {
                sent = swapEtherToTokenAndTransfer(amount, outCurrency, destination);
            }

            emit FundsOut(amount, destination, ETH_TOKEN_ADDRESS, sent);

            sum = sum.add(amount);
        }
        require(sum == balance, "The sum of all amounts should be equal balance but it does not");
    }

    //@dev assumed to be receiving ether wei
    //@param token destination token contract address
    //@param destAddress address to send swapped tokens to
    function swapEtherToTokenAndTransfer (uint256 amount, ERC20 token, address destAddress) internal returns (uint) {
        uint minRate;
        (, minRate) = kyberNetworkProxy.getExpectedRate(ETH_TOKEN_ADDRESS, token, amount);

        bytes memory hint;

        uint destAmount = kyberNetworkProxy.tradeWithHint.value(amount)(
            ETH_TOKEN_ADDRESS, // src token
            amount, // amount to convert
            token, // token to convert to
            destAddress, // where to send tokens to
            2**255, // max destintation amount.  should always be bigger than amount converted
            minRate, // min conversion rate
            address(0x0), // fee sharing wallet id.  should be 0x0
            hint // hint bytes.  should be empty
        );
        require(destAmount > 0, "Your ETH could not be converted via the Kyber Network");

        return destAmount;
    }
}
