pragma solidity 0.4.25;

import "./DeconetPaymentsSplitting.sol";
import "../node_modules/@optionality.io/clone-factory/contracts/CloneFactory.sol";

/**
 * @title Clone factory contract for DeconetPaymentsSplitting contract.
 *
 * @dev Contract provide convenient way of deploying clones of DeconetPaymentsSplitting contract.
 */
contract DeconetPaymentsSplittingFactory is CloneFactory {

    // PaymentsSplitting master-contract address.
    address public libraryAddress;

    // Logged when a new PaymentsSplitting clone is deployed to the chain.
    event PaymentsSplittingCreated(address newCloneAddress);

    /**
     * @dev Constructor for the contract.
     * @param _libraryAddress PaymentsSplitting master-contract address.
     */
    constructor(address _libraryAddress) public {
        libraryAddress = _libraryAddress;
    }

    /**
     * @dev Create PaymentsSplitting clone.
     * @param _destinations Destination addresses of the new PaymentsSplitting contract clone.
     * @param _sharesMantissa Mantissa values for destinations shares ordered respectively with `_destinations`.
     * @param _sharesExponent Exponent of a power term that forms shares floating-point numbers, expected to
     * be the same for all values in `_sharesMantissa`.
     */
    function createPaymentsSplitting(
        address[] _destinations,
        uint[] _sharesMantissa,
        uint _sharesExponent
    )
        external
        returns(address)
    {
        address clone = createClone(libraryAddress);
        DeconetPaymentsSplitting(clone).setUpDistribution(_destinations, _sharesMantissa, _sharesExponent);
        emit PaymentsSplittingCreated(clone);
        return clone;
    }
}
