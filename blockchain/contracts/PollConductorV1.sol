// SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;

/**
 * @title PollConductorV1
 * @author Rahul Mayekar (https://github.com/CrazzyPhoton)
 * @notice A decentralized polling system that allows users to create polls, vote on polls, and manage polls
 * @dev This contract implements a comprehensive polling mechanism with administrative controls
 */
contract PollConductorV1 {
    
    // STATE VARIABLES //

    /**
     * @notice Structure representing a poll with all its associated data
     * @dev Contains creator address, timing, validity status, content, and voting results
     */
    struct Poll {
        address creator;      /// @dev Address of the poll creator
        uint64 startTime;     /// @dev Timestamp when the poll was created
        uint64 endTime;       /// @dev Timestamp when the poll expires
        bool isVoid;          /// @dev Whether the poll has been voided
        string statement;     /// @dev The poll question or statement
        string[] choices;     /// @dev Array of available voting choices
        uint256[] votes;      /// @dev Array tracking vote counts for each choice
    }

    /**
     * @notice Indicates whether user poll creation is currently paused
     * @dev Only affects non-owner users; owner can always create polls
     */
    bool public _isUserPollCreationPaused;
    
    /**
     * @notice Maximum number of choices allowed per poll
     * @dev Can be updated by contract owner, must be at least 2
     */
    uint16 public maximumChoices = 10;
    
    /**
     * @notice Maximum duration allowed for polls in seconds
     * @dev Can be updated by contract owner, must be at least 1 minute
     */
    uint32 public maximumDuration = 365 days;
    
    /**
     * @notice Address of the contract owner with administrative privileges
     * @dev Can update parameters, pause creation, and manage any poll
     */
    address public owner;

    /**
     * @notice Total number of polls created since contract deployment
     * @dev Used as incremental poll ID counter starting from 1
     */
    uint256 public pollsCreated;

    /**
     * @notice Mapping from poll ID to Poll struct containing poll data
     * @dev Private mapping accessed through getPollDetails function
     */
    mapping(uint256 => Poll) private pollId;
    
    /**
     * @notice Mapping tracking whether an address has voted on a specific poll
     * @dev Maps pollId => voter address => has voted boolean
     */
    mapping(uint256 => mapping(address => bool)) private _hasVotedForPollId;
    
    /**
     * @notice Mapping tracking which choice an address voted for on a specific poll
     * @dev Maps pollId => voter address => choice index (1-based, 0 means no vote)
     */
    mapping(uint256 => mapping(address => uint16)) private _choiceVotedForPollId;

    // EVENTS //

    /**
     * @notice Emitted when a new poll is successfully created
     * @param _pollId The unique identifier of the created poll
     * @param _creator Address of the poll creator
     * @param _startTime Timestamp when the poll was created
     * @param _endTime Timestamp when the poll will expire
     * @param _statement The poll question or statement
     * @param _choices Array of available voting choices
     */
    event PollCreated(
        uint256 _pollId,
        address _creator,
        uint64 _startTime,
        uint64 _endTime,
        string _statement,
        string[] _choices
    );
    
    /**
     * @notice Emitted when a vote is cast on a poll
     * @param _pollId The poll ID that received the vote
     * @param _voter Address of the voter
     * @param _choiceVoted The choice index voted for (1-based)
     */
    event PollVoted(uint256 _pollId, address _voter, uint16 _choiceVoted);
    
    /**
     * @notice Emitted when a poll's end time is updated
     * @param _pollId The poll ID whose end time was updated
     * @param _previousEndTime The previous end timestamp
     * @param _newEndTime The new end timestamp
     */
    event PollEndTimeUpdated(uint256 _pollId, uint64 _previousEndTime, uint64 _newEndTime);
    
    /**
     * @notice Emitted when a poll is marked as void
     * @param _pollId The poll ID that was voided
     */
    event PollDeemedVoid(uint256 _pollId);
    
    /**
     * @notice Emitted when the maximum choices limit is updated
     * @param _newMaximumChoices The new maximum number of choices allowed
     */
    event MaximumChoicesUpdated(uint16 _newMaximumChoices);
    
    /**
     * @notice Emitted when the maximum duration limit is updated
     * @param _newMaximumDuration The new maximum duration allowed for polls
     */
    event MaximumDurationUpdated(uint32 _newMaximumDuration);
    
    /**
     * @notice Emitted when contract ownership is transferred
     * @param _previousOwner Address of the previous owner
     * @param _newOwner Address of the new owner
     */
    event OwnershipTransferred(address _previousOwner, address _newOwner);
    
    /**
     * @notice Emitted when user poll creation is paused
     */
    event UserPollCreationPaused();
    
    /**
     * @notice Emitted when user poll creation is unpaused
     */
    event UserPollCreationUnpaused();

    // ERRORS //

    /**
     * @notice Error thrown when the number of choices is outside allowed bounds
     * @param choicesAdded Number of choices attempted to be added
     * @param minimumChoicesAllowed Minimum number of choices required
     * @param maximumChoicesAllowed Maximum number of choices allowed
     */
    error ChoicesOutOfBounds(
        uint16 choicesAdded,
        uint16 minimumChoicesAllowed,
        uint16 maximumChoicesAllowed
    );
    
    /**
     * @notice Error thrown when poll duration is outside allowed bounds
     * @param durationAdded Duration attempted to be set
     * @param minimumDurationAllowed Minimum duration allowed
     * @param maximumDurationAllowed Maximum duration allowed
     */
    error DurationOutOfBounds(
        uint32 durationAdded,
        uint32 minimumDurationAllowed,
        uint32 maximumDurationAllowed
    );
    
    /**
     * @notice Error thrown when new duration exceeds maximum allowed
     * @param newDurationAdded New duration attempted to be set
     * @param maximumDurationAllowed Maximum duration allowed
     */
    error NewDurationOutOfBounds(
        uint32 newDurationAdded,
        uint32 maximumDurationAllowed
    );
    
    /**
     * @notice Error thrown when attempting to access a non-existent poll
     */
    error NonExistentPollId();
    
    /**
     * @notice Error thrown when attempting to interact with an ended poll
     */
    error PollEndedForPollId();
    
    /**
     * @notice Error thrown when attempting to shorten a poll's duration
     */
    error PollDurationCannotBeShortened();
    
    /**
     * @notice Error thrown when a user attempts to vote twice on the same poll
     */
    error CallerVotedForPollId();
    
    /**
     * @notice Error thrown when a non-owner attempts owner-only functions
     */
    error CallerNotOwner();
    
    /**
     * @notice Error thrown when maximum duration is set below one minute
     */
    error MaximumDurationLesserThanOneMinute();
    
    /**
     * @notice Error thrown when maximum choices is set below two
     */
    error MaximumChoicesLessThanTwo();
    
    /**
     * @notice Error thrown when poll creation is paused for regular users
     */
    error PollCreationPaused();
    
    /**
     * @notice Error thrown when an invalid choice index is provided
     */
    error IncorrectChoiceIndex();
    
    /**
     * @notice Error thrown when neither poll creator nor owner attempts restricted action
     */
    error CallerNotPollCreatorNorOwner();
    
    /**
     * @notice Error thrown when attempting to interact with a voided poll
     */
    error PollVoidedForPollId();

    // CONSTRUCTOR //

    /**
     * @notice Initializes the contract and sets the deployer as owner
     * @dev Emits OwnershipTransferred event with previous owner as zero address
     */
    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    // MODIFIERS //

    /**
     * @notice Restricts function access to contract owner only
     * @dev Reverts with CallerNotOwner error if caller is not the owner
     */
    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert CallerNotOwner();
        }
        _;
    }

    /**
     * @notice Restricts function access to poll creator or contract owner
     * @dev Also validates that the poll ID exists
     * @param _pollId The poll ID to check permissions for
     */
    modifier onlyPollCreatorOrOwner(uint256 _pollId) {
        if (_pollId < 1 || _pollId > pollsCreated) {
            revert NonExistentPollId();
        }
        if (msg.sender != pollId[_pollId].creator && msg.sender != owner) {
            revert CallerNotPollCreatorNorOwner();
        }
        _;
    }

    /**
     * @notice Checks if user poll creation is paused for non-owners
     * @dev Owner can always create polls regardless of pause status
     */
    modifier isUserPollCreationPaused() {
        if (msg.sender != owner && _isUserPollCreationPaused) {
            revert PollCreationPaused();
        }
        _;
    }

    // FUNCTIONS //

    /**
     * @notice Creates a new poll with specified parameters
     * @dev Increments pollsCreated counter and initializes poll struct
     * @param _statement The poll question or statement
     * @param _choices Array of voting choices (2 to maximumChoices)
     * @param _duration Duration of the poll in seconds (1 minute to maximumDuration)
     */
    function createPoll(
        string memory _statement,
        string[] memory _choices,
        uint32 _duration
    ) external isUserPollCreationPaused {
        uint16 _choicesLength = uint16(_choices.length);
        if (_choicesLength < 2 || _choicesLength > maximumChoices) {
            revert ChoicesOutOfBounds(_choicesLength, 2, maximumChoices);
        }
        if (_duration < 1 minutes || _duration > maximumDuration) {
            revert DurationOutOfBounds(_duration, 1 minutes, maximumDuration);
        }
        unchecked {
            ++pollsCreated;
        }
        uint256 newPollId = pollsCreated;
        Poll storage p = pollId[newPollId];
        p.creator = msg.sender;
        p.startTime = uint64(block.timestamp);
        p.endTime = uint64(block.timestamp + _duration);
        p.statement = _statement;
        p.choices = _choices;
        p.votes = new uint256[](_choicesLength);
        emit PollCreated(
            newPollId,
            p.creator,
            p.startTime,
            p.endTime,
            p.statement,
            p.choices
        );
    }

    /**
     * @notice Casts a vote for a specific choice on a poll
     * @dev Prevents double voting and validates poll status and choice
     * @param _pollId The poll ID to vote on
     * @param choiceIndex The index of the choice to vote for (0-based)
     */
    function vote(uint256 _pollId, uint16 choiceIndex) external {
        if (_pollId < 1 || _pollId > pollsCreated) {
            revert NonExistentPollId();
        }
        Poll storage p = pollId[_pollId];
        if (p.isVoid) {
            revert PollVoidedForPollId();
        }
        if (choiceIndex >= p.choices.length) {
            revert IncorrectChoiceIndex();
        }
        if (block.timestamp > p.endTime) {
            revert PollEndedForPollId();
        }
        if (_hasVotedForPollId[_pollId][msg.sender]) {
            revert CallerVotedForPollId();
        }
        _hasVotedForPollId[_pollId][msg.sender] = true;
        _choiceVotedForPollId[_pollId][msg.sender] = choiceIndex + 1;
        unchecked {
            ++p.votes[choiceIndex];
        }
        emit PollVoted(_pollId, msg.sender, choiceIndex + 1);
    }

    /**
     * @notice Updates the end time of an existing poll
     * @dev Only allows extending duration, not shortening. Must be called by creator or owner
     * @param _pollId The poll ID to update
     * @param _newDuration The new total duration from start time
     */
    function updatePollEndTime(uint256 _pollId, uint32 _newDuration)
        external
        onlyPollCreatorOrOwner(_pollId)
    {
        Poll storage p = pollId[_pollId];
        if (p.isVoid) {
            revert PollVoidedForPollId();
        }
        if (block.timestamp >= p.endTime) {
            revert PollEndedForPollId();
        } else if (p.endTime > p.startTime + _newDuration) {
            revert PollDurationCannotBeShortened();
        } else if (_newDuration > maximumDuration) {
            revert NewDurationOutOfBounds(_newDuration, maximumDuration);
        }
        uint64 _previousEndTime = p.endTime;
        p.endTime = p.startTime + _newDuration;
        emit PollEndTimeUpdated(_pollId, _previousEndTime, p.endTime);
    }

    /**
     * @notice Marks a poll as void, preventing further voting
     * @dev Can only be called by poll creator or contract owner
     * @param _pollId The poll ID to void
     */
    function deemPollVoid(uint256 _pollId)
        external
        onlyPollCreatorOrOwner(_pollId)
    {
        Poll storage p = pollId[_pollId];
        if (p.isVoid) {
            revert PollVoidedForPollId();
        }
        p.isVoid = true;
        emit PollDeemedVoid(_pollId);
    }

    /**
     * @notice Updates the maximum number of choices allowed per poll
     * @dev Only callable by contract owner, must be at least 2
     * @param _newMaximumChoices The new maximum number of choices
     */
    function updateMaximumChoices(uint16 _newMaximumChoices)
        external
        onlyOwner
    {
        if (_newMaximumChoices < 2) {
            revert MaximumChoicesLessThanTwo();
        }
        maximumChoices = _newMaximumChoices;
        emit MaximumChoicesUpdated(_newMaximumChoices);
    }

    /**
     * @notice Updates the maximum duration allowed for polls
     * @dev Only callable by contract owner, must be at least 1 minute
     * @param _newMaximumDuration The new maximum duration in seconds
     */
    function updateMaximumDuration(uint32 _newMaximumDuration)
        external
        onlyOwner
    {
        if (_newMaximumDuration < 1 minutes) {
            revert MaximumDurationLesserThanOneMinute();
        }
        maximumDuration = _newMaximumDuration;
        emit MaximumDurationUpdated(_newMaximumDuration);
    }

    /**
     * @notice Transfers ownership of the contract to a new address
     * @dev Only callable by current owner
     * @param _newOwner The address to transfer ownership to
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        address _previousOwner = owner;
        owner = _newOwner;
        emit OwnershipTransferred(_previousOwner, _newOwner);
    }

    /**
     * @notice Pauses poll creation for all users except the owner
     * @dev Only callable by contract owner
     */
    function pauseUserPollCreation() external onlyOwner {
        _isUserPollCreationPaused = true;
        emit UserPollCreationPaused();
    }

    /**
     * @notice Unpauses poll creation for all users
     * @dev Only callable by contract owner
     */
    function unpauseUserPollCreation() external onlyOwner {
        _isUserPollCreationPaused = false;
        emit UserPollCreationUnpaused();
    }

    /**
     * @notice Checks if an address has voted on a specific poll
     * @param _pollId The poll ID to check
     * @param _voter The address to check voting status for
     * @return hasVoted True if the address has voted on the poll, false otherwise
     */
    function hasVotedForPollId(uint256 _pollId, address _voter)
        external
        view
        returns (bool hasVoted)
    {
        hasVoted = _hasVotedForPollId[_pollId][_voter];
        return hasVoted;
    }

    /**
     * @notice Returns the choice index that an address voted for on a specific poll
     * @param _pollId The poll ID to check
     * @param _voter The address to check choice for
     * @return choice The choice index voted for (1-based, 0 if no vote cast)
     */
    function choiceVotedForPollId(uint256 _pollId, address _voter)
        external
        view
        returns (uint16 choice)
    {
        choice = _choiceVotedForPollId[_pollId][_voter];
        return choice;
    }

    /**
     * @notice Returns all poll IDs created by a specific address
     * @dev Uses assembly to resize the array to actual count for gas efficiency
     * @param _creator The address to get created polls for
     * @return pollIds Array of poll IDs created by the address
     */
    function pollsCreatedByAddress(address _creator)
        external
        view
        returns (uint256[] memory pollIds)
    {
        pollIds = new uint256[](pollsCreated);
        uint256 counter = 0;
        for (uint256 i = 1; i <= pollsCreated; ++i) {
            if (pollId[i].creator == _creator) {
                pollIds[counter] = i;
                unchecked {
                    ++counter;
                }
            }
        }
        assembly {
            mstore(pollIds, counter)
        }
        return pollIds;
    }

    /**
     * @notice Returns all poll IDs that an address has voted on
     * @dev Uses assembly to resize the array to actual count for gas efficiency
     * @param _voter The address to get voted polls for
     * @return pollIds Array of poll IDs the address has voted on
     */
    function pollsVotedByAddress(address _voter)
        external
        view
        returns (uint256[] memory pollIds)
    {
        pollIds = new uint256[](pollsCreated);
        uint256 counter = 0;
        for (uint256 i = 1; i <= pollsCreated; ++i) {
            if (_hasVotedForPollId[i][_voter]) {
                pollIds[counter] = i;
                unchecked {
                    ++counter;
                }
            }
        }
        assembly {
            mstore(pollIds, counter)
        }
        return pollIds;
    }

    /**
     * @notice Returns all poll IDs that an address has not voted on
     * @dev Uses assembly to resize the array to actual count for gas efficiency
     * @param _voter The address to get unvoted polls for
     * @return pollIds Array of poll IDs the address has not voted on
     */
    function pollsNotVotedByAddress(address _voter)
        external
        view
        returns (uint256[] memory pollIds)
    {
        pollIds = new uint256[](pollsCreated);
        uint256 counter = 0;
        for (uint256 i = 1; i <= pollsCreated; ++i) {
            if (!_hasVotedForPollId[i][_voter]) {
                pollIds[counter] = i;
                unchecked {
                    ++counter;
                }
            }
        }
        assembly {
            mstore(pollIds, counter)
        }
        return pollIds;
    }

    /**
     * @notice Returns complete details of a specific poll
     * @dev Calculates total votes by summing all choice vote counts
     * @param _pollId The poll ID to get details for
     * @return _creator Address of the poll creator
     * @return _startTime Timestamp when the poll was created
     * @return _endTime Timestamp when the poll expires
     * @return _isVoid Whether the poll has been voided
     * @return _statement The poll question or statement
     * @return _choices Array of available voting choices
     * @return _votes Array of vote counts for each choice
     * @return totalVotes Total number of votes cast on the poll
     */
    function getPollDetails(uint256 _pollId)
        external
        view
        returns (
            address _creator,
            uint64 _startTime,
            uint64 _endTime,
            bool _isVoid,
            string memory _statement,
            string[] memory _choices,
            uint256[] memory _votes,
            uint256 totalVotes
        )
    {
        Poll memory p = pollId[_pollId];
        _creator = p.creator;
        _startTime = p.startTime;
        _endTime = p.endTime;
        _isVoid = p.isVoid;
        _statement = p.statement;
        _choices = p.choices;
        _votes = p.votes;
        for (uint256 i = 0; i < _votes.length; ++i) {
            unchecked {
                totalVotes += _votes[i];
            }
        }
        return (
            _creator,
            _startTime,
            _endTime,
            _isVoid,
            _statement,
            _choices,
            _votes,
            totalVotes
        );
    }
}
