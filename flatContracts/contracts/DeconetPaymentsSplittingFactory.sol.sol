pragma solidity 0.4.24;
// produced by the Solididy File Flattener (c) David Appleton 2018
// contact : dave@akomba.com
// released under Apache 2.0 licence
contract DeconetPaymentsSplitting {

    // Logged on this distribution set up completion.
    event DistributionCreated (
        address[] destinations,
        uint[] sharesMantissa,
        uint sharesExponent
    );

    // Logged when funds landed to or been sent out from this contract balance.
    event FundsOperation (
        address indexed senderOrAddressee,
        uint amount,
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
    }

    // Stores exponent of a power term of a floating-point number.
    uint public sharesExponent;

    // Stores list of distributions.
    Distribution[] public distributions;

    /**
     * @dev Payable fallback that tries to send over incoming funds to the distribution destinations splitted
     * by pre-configured shares. In case when there is not enough gas sent for the transaction to complete
     * distribution, all funds will be kept in contract untill somebody calls `withdrawFullContractBalance` to
     * run postponed distribution and withdraw contract's balance funds.
     */
    function () public payable {
        emit FundsOperation(msg.sender, msg.value, FundsOperationType.Incoming);
        distributeFunds();
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
        uint _sharesExponent
    )
        external
    {
        require(distributions.length == 0); // Make sure the clone isn't initialized yet.
        require(_destinations.length <= 8 && _destinations.length > 0);
        uint sum = 0;
        for (uint i = 0; i < _destinations.length; i++) {
            require(!isContract(_destinations[i])); // Forbid contract as destination so that transfer can never fail
            sum += _sharesMantissa[i];
            distributions.push(Distribution(_destinations[i], _sharesMantissa[i]));
        }
        require(sum == 10**(_sharesExponent + 2)); // taking into account 100% by adding 2 to the exponent.
        sharesExponent = _sharesExponent;
        emit DistributionCreated(_destinations, _sharesMantissa, _sharesExponent);
    }

    /**
     * @dev Process the available balance through the distribution and send money over to destination addresses.
     */
    function distributeFunds() public {
        uint balance = address(this).balance;
        uint exponent = sharesExponent;
        require(balance >= 10**(exponent + 2));
        for (uint i = 0; i < distributions.length; i++) {
            Distribution memory distribution = distributions[i];
            uint amount = calculatePayout(balance, distribution.mantissa, exponent);
            distribution.destination.transfer(amount);
            emit FundsOperation(distribution.destination, amount, FundsOperationType.Outgoing);
        }
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

    /**
     * @dev Checks whether or not a given address contains a contract
     * @param _addr The address to check
     * @return A boolean indicating whether or not the address is a contract
     */
    function isContract(address _addr) private view returns (bool) {
        uint32 size;
        assembly {
            size := extcodesize(_addr)
        }
        return (size > 0);
    }
}

contract Ownable {
  address public owner;


  event OwnershipRenounced(address indexed previousOwner);
  event OwnershipTransferred(
    address indexed previousOwner,
    address indexed newOwner
  );


  /**
   * @dev The Ownable constructor sets the original `owner` of the contract to the sender
   * account.
   */
  constructor() public {
    owner = msg.sender;
  }

  /**
   * @dev Throws if called by any account other than the owner.
   */
  modifier onlyOwner() {
    require(msg.sender == owner);
    _;
  }

  /**
   * @dev Allows the current owner to relinquish control of the contract.
   * @notice Renouncing to ownership will leave the contract without an owner.
   * It will not be possible to call the functions with the `onlyOwner`
   * modifier anymore.
   */
  function renounceOwnership() public onlyOwner {
    emit OwnershipRenounced(owner);
    owner = address(0);
  }

  /**
   * @dev Allows the current owner to transfer control of the contract to a newOwner.
   * @param _newOwner The address to transfer ownership to.
   */
  function transferOwnership(address _newOwner) public onlyOwner {
    _transferOwnership(_newOwner);
  }

  /**
   * @dev Transfers control of the contract to a newOwner.
   * @param _newOwner The address to transfer ownership to.
   */
  function _transferOwnership(address _newOwner) internal {
    require(_newOwner != address(0));
    emit OwnershipTransferred(owner, _newOwner);
    owner = _newOwner;
  }
}

contract CloneFactory {

  event CloneCreated(address indexed target, address clone);

  function createClone(address target) internal returns (address result) {
    bytes memory clone = hex"3d602d80600a3d3981f3363d3d373d3d3d363d73bebebebebebebebebebebebebebebebebebebebe5af43d82803e903d91602b57fd5bf3";
    bytes20 targetBytes = bytes20(target);
    for (uint i = 0; i < 20; i++) {
      clone[20 + i] = targetBytes[i];
    }
    assembly {
      let len := mload(clone)
      let data := add(clone, 0x20)
      result := create(0, data, len)
    }
  }
}

contract DeconetPaymentsSplittingFactory is Ownable, CloneFactory {

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
     * @dev Updates library address with the given value.
     * @param _libraryAddress Address of a new base contract.
     */
    function setLibraryAddress(address _libraryAddress) external onlyOwner {
        require(libraryAddress != _libraryAddress);
        require(_libraryAddress != address(0x0));

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
