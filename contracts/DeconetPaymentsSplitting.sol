pragma solidity 0.4.24;

import "../node_modules/openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./Kyber.sol";


/**
 * @title Payments Splitting contract.
 *
 * @dev Contract for companies or groups of people who wants to accept Ethereum donations or payments and
 * distribution funds by preconfigured rules.
 */
contract DeconetPaymentsSplitting {
    using SafeMath for uint;

    // copied from kyber contract
    ERC20 constant internal ETH_TOKEN_ADDRESS = ERC20(0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee);
    uint  constant internal MAX_QTY   = (10**28); // 10B tokens

    // Logged on this distribution set up completion.
    event DistributionCreated (
        address[] destinations,
        uint[] sharesMantissa,
        ERC20[] destinationTokens,
        uint sharesExponent
    );

    // Logged when funds landed to or been sent out from this contract balance.
    event FundsOperation (
        address indexed senderOrAddressee,
        uint amount,
        ERC20 token,
        FundsOperationType indexed operationType
    );

    // Enumeration of possible funds operations.
    enum FundsOperationType { Incoming, Outgoing }

    // Describes Distribution destination and its share of all incoming funds.
    struct Distribution {
        // Destination address of the distribution.
        address destination;

        // Floating-point number mantissa of a share allotted for a destination address.
        uint mantissa;

        // Token or currency the users wants to receive
        ERC20 destinationToken;
    }

    // Stores exponent of a power term of a floating-point number.
    uint public sharesExponent;

    // Stores list of distributions.
    Distribution[] public distributions;

    // the kyber network smart contract address (ropsten)
    KyberNetworkProxyInterface kyberNetworkProxy =  KyberNetworkProxyInterface(0x818E6FECD516Ecc3849DAf6845e3EC868087B755);

    /**
     * @dev Payable fallback that tries to send over incoming funds to the distribution destinations splitted
     * by pre-configured shares. In case when there is not enough gas sent for the transaction to complete
     * distribution, all funds will be kept in contract untill somebody calls `withdrawFullContractBalance` to
     * run postponed distribution and withdraw contract's balance funds.
     */
    function () public payable {
        emit FundsOperation(msg.sender, msg.value, ETH_TOKEN_ADDRESS, FundsOperationType.Incoming);
        // Distribution happens in a for loop and every iteration requires fixed 10990 of gas to perform
        // distribution. Also, 1512 of gas is required to call `withdrawFullContractBalance` method and do
        // some checks and preps in it.
        if (gasleft() < (10990 * distributions.length + 1512)) return;
        withdrawFullContractBalance();
    }

    /**
     * @dev Set up distribution for the current clone, can be called only once.
     * @param _destinations Destination addresses of the current payments splitting contract clone.
     * @param _sharesMantissa Mantissa values for destinations shares ordered respectively with `_destinations`.
     * @param _sharesExponent Exponent of a power term that forms shares floating-point numbers, expected to
     * be the same for all values in `_sharesMantissa`.
     */
    function setUpDistribution(
        address[] _destinations,
        uint[] _sharesMantissa,
        ERC20[] _destinationTokens,
        uint _sharesExponent
    )
        external
    {
        require(distributions.length == 0); // Make sure the clone isn't initialized yet.
        // max of 5 destinations
        require(_destinations.length <= 5 && _destinations.length > 0);

        require(
            _destinations.length == _sharesMantissa.length &&
            _destinations.length == _destinationTokens.length,
            "Array parameter length mismatch error.  Check array input parameters."
        );

        uint sum = 0;
        for (uint i = 0; i < _destinations.length; i++) {
            sum = sum.add(_sharesMantissa[i]);
            distributions.push(Distribution(_destinations[i], _sharesMantissa[i], _destinationTokens[i]));
        }
        require(sum == 10**(_sharesExponent + 2)); // taking into account 100% by adding 2 to the exponent.
        sharesExponent = _sharesExponent;
        emit DistributionCreated(_destinations, _sharesMantissa, _destinationTokens, _sharesExponent);
    }

    /**
     * @dev Process the available balance through the distribution and send money over to destination address.
     */
    function withdrawFullContractBalance() public {
        uint distributionsCount = distributions.length;
        if (gasleft() < 10990 * distributionsCount) return;
        uint balance = address(this).balance;
        uint exponent = sharesExponent;
        require(balance >= 10**(exponent + 2));
        for (uint i = 0; i < distributionsCount; i++) {
            Distribution memory distribution = distributions[i];
            uint amount = calculatePayout(balance, distribution.mantissa, exponent);
            if (distribution.destinationToken == ETH_TOKEN_ADDRESS && distribution.destination.send(amount)) {
                emit FundsOperation(distribution.destination, amount, ETH_TOKEN_ADDRESS, FundsOperationType.Outgoing);
            } else {
                uint tokensSent = swapEtherToTokenAndSend(amount, distribution.destinationToken, distribution.destination);
                emit FundsOperation(distribution.destination, tokensSent, distribution.destinationToken, FundsOperationType.Outgoing);
            }
        }
    }

    function changeDestinationToken(ERC20 newToken, uint distributionIndex) {
        require(distributionIndex < distributions.length, "Array out of bounds");
        Distribution storage distribution = distributions[distributionIndex];
        require(msg.sender == distribution.destination, "Only the destination address can change the destination token");
        distribution.destinationToken = newToken;
    }

    function getDistributionsLength() public view returns (uint) {
        return distributions.length;
    }

    function getDistribution(uint distributionIndex) public view returns (address destination, uint mantissa, ERC20 destinationToken) {
        require(distributionIndex < distributions.length, "Array out of bounds");
        Distribution memory distribution = distributions[distributionIndex];
        return (
            distribution.destination,
            distribution.mantissa,
            distribution.destinationToken
        );
    }

    /**
     * @dev Calculates a share of the full amount.
     * @param _fullAmount Full amount.
     * @param _shareMantissa Mantissa of the percentage floating-point number.
     * @param _shareExponent Exponent of the percentage floating-point number.
     * @return An uint of the payout.
     */
    function calculatePayout(uint _fullAmount, uint _shareMantissa, uint _shareExponent) public pure returns(uint) {
        return (_fullAmount / (10 ** (_shareExponent + 2))) * _shareMantissa;
    }

    //@dev assumed to be receiving ether wei
    //@param token destination token contract address
    //@param destAddress address to send swapped tokens to
    function swapEtherToTokenAndSend (uint256 amount, ERC20 token, address destAddress) internal returns (uint) {
        uint minRate;
        (, minRate) = kyberNetworkProxy.getExpectedRate(ETH_TOKEN_ADDRESS, token, amount);

        bytes memory hint;

        return kyberNetworkProxy.tradeWithHint(
            ETH_TOKEN_ADDRESS,
            amount,
            token,
            destAddress,
            MAX_QTY,
            minRate,
            0,
            hint
        );
    }
}
