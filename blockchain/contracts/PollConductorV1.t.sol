// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/src/Test.sol";
import "../contracts/PollConductorV1.sol";

contract PollConductorV1Test is Test {
    PollConductorV1 public pollConductor;

    // Test addresses
    address public owner;
    address public user1 = address(0x1);
    address public user2 = address(0x2);
    address public user3 = address(0x3);
    address public newOwner = address(0x4);

    // Test data
    string public constant TEST_STATEMENT = "What is your favorite color?";
    string[] private testChoices;
    uint32 public constant TEST_DURATION = 1 days;

    // Events for testing
    event PollCreated(
        uint256 _pollId,
        address _creator,
        uint64 _startTime,
        uint64 _endTime,
        string _statement,
        string[] _choices
    );
    event PollVoted(uint256 _pollId, address _voter, uint16 _choiceVoted);
    event PollEndTimeUpdated(
        uint256 _pollId,
        uint64 _previousEndTime,
        uint64 _newEndTime
    );
    event PollDeemedVoid(uint256 _pollId);
    event MaximumChoicesUpdated(uint16 _newMaximumChoices);
    event MaximumDurationUpdated(uint32 _newMaximumDuration);
    event OwnershipTransferred(address _previousOwner, address _newOwner);
    event UserPollCreationPaused();
    event UserPollCreationUnpaused();

    function setUp() public {
        owner = address(this);
        pollConductor = new PollConductorV1();

        // Setup test choices
        testChoices.push("Red");
        testChoices.push("Blue");
        testChoices.push("Green");
    }

    // ===== CONSTRUCTOR TESTS =====

    function testConstructorSetsOwner() public view {
        assertEq(pollConductor.owner(), owner);
    }

    function testConstructorEmitsOwnershipTransferred() public {
        vm.expectEmit(true, true, false, true);
        emit OwnershipTransferred(address(0), address(this));

        new PollConductorV1();
    }

    function testConstructorInitialState() public view {
        assertEq(pollConductor.pollsCreated(), 0);
        assertEq(pollConductor.maximumChoices(), 10);
        assertEq(pollConductor.maximumDuration(), 365 days);
        assertFalse(pollConductor._isUserPollCreationPaused());
    }

    // ===== MODIFIER TESTS =====

    function testOnlyOwnerModifier() public {
        vm.prank(user1);
        vm.expectRevert(PollConductorV1.CallerNotOwner.selector);
        pollConductor.updateMaximumChoices(5);
    }

    function testOnlyPollCreatorOrOwnerModifier() public {
        // Create poll first
        pollConductor.createPoll(TEST_STATEMENT, testChoices, TEST_DURATION);

        vm.prank(user1);
        vm.expectRevert(PollConductorV1.CallerNotPollCreatorNorOwner.selector);
        pollConductor.deemPollVoid(1);
    }

    function testOnlyPollCreatorOrOwnerModifierWithNonExistentPoll() public {
        vm.expectRevert(PollConductorV1.NonExistentPollId.selector);
        pollConductor.deemPollVoid(999);
    }

    function testIsUserPollCreationPausedModifier() public {
        pollConductor.pauseUserPollCreation();

        vm.prank(user1);
        vm.expectRevert(PollConductorV1.PollCreationPaused.selector);
        pollConductor.createPoll(TEST_STATEMENT, testChoices, TEST_DURATION);
    }

    function testIsUserPollCreationPausedModifierAllowsOwner() public {
        pollConductor.pauseUserPollCreation();

        // Owner should still be able to create polls
        pollConductor.createPoll(TEST_STATEMENT, testChoices, TEST_DURATION);
        assertEq(pollConductor.pollsCreated(), 1);
    }

    // ===== CREATE POLL TESTS =====

    function testCreatePollSuccess() public {
        vm.expectEmit(true, true, false, true);
        emit PollCreated(
            1,
            owner,
            uint64(block.timestamp),
            uint64(block.timestamp + TEST_DURATION),
            TEST_STATEMENT,
            testChoices
        );

        pollConductor.createPoll(TEST_STATEMENT, testChoices, TEST_DURATION);

        assertEq(pollConductor.pollsCreated(), 1);

        (
            address creator,
            uint64 startTime,
            uint64 endTime,
            bool isVoid,
            string memory statement,
            string[] memory choices,
            uint256[] memory votes,
            uint256 totalVotes
        ) = pollConductor.getPollDetails(1);

        assertEq(creator, owner);
        assertEq(startTime, block.timestamp);
        assertEq(endTime, block.timestamp + TEST_DURATION);
        assertFalse(isVoid);
        assertEq(statement, TEST_STATEMENT);
        assertEq(choices.length, 3);
        assertEq(choices[0], "Red");
        assertEq(choices[1], "Blue");
        assertEq(choices[2], "Green");
        assertEq(votes.length, 3);
        assertEq(votes[0], 0);
        assertEq(votes[1], 0);
        assertEq(votes[2], 0);
        assertEq(totalVotes, 0);
    }

    function testCreatePollTooFewChoices() public {
        string[] memory invalidChoices = new string[](1);
        invalidChoices[0] = "Only One";

        vm.expectRevert(
            abi.encodeWithSelector(
                PollConductorV1.ChoicesOutOfBounds.selector,
                1,
                2,
                10
            )
        );
        pollConductor.createPoll(TEST_STATEMENT, invalidChoices, TEST_DURATION);
    }

    function testCreatePollTooManyChoices() public {
        string[] memory invalidChoices = new string[](11);
        for (uint i = 0; i < 11; i++) {
            invalidChoices[i] = "Choice";
        }

        vm.expectRevert(
            abi.encodeWithSelector(
                PollConductorV1.ChoicesOutOfBounds.selector,
                11,
                2,
                10
            )
        );
        pollConductor.createPoll(TEST_STATEMENT, invalidChoices, TEST_DURATION);
    }

    function testCreatePollDurationTooShort() public {
        vm.expectRevert(
            abi.encodeWithSelector(
                PollConductorV1.DurationOutOfBounds.selector,
                30,
                1 minutes,
                365 days
            )
        );
        pollConductor.createPoll(TEST_STATEMENT, testChoices, 30);
    }

    function testCreatePollDurationTooLong() public {
        uint32 tooLong = 366 days;
        vm.expectRevert(
            abi.encodeWithSelector(
                PollConductorV1.DurationOutOfBounds.selector,
                tooLong,
                1 minutes,
                365 days
            )
        );
        pollConductor.createPoll(TEST_STATEMENT, testChoices, tooLong);
    }

    function testCreatePollMinimumDuration() public {
        pollConductor.createPoll(TEST_STATEMENT, testChoices, 1 minutes);
        assertEq(pollConductor.pollsCreated(), 1);
    }

    function testCreatePollMaximumDuration() public {
        pollConductor.createPoll(TEST_STATEMENT, testChoices, 365 days);
        assertEq(pollConductor.pollsCreated(), 1);
    }

    function testCreatePollMinimumChoices() public {
        string[] memory minChoices = new string[](2);
        minChoices[0] = "Yes";
        minChoices[1] = "No";

        pollConductor.createPoll(TEST_STATEMENT, minChoices, TEST_DURATION);
        assertEq(pollConductor.pollsCreated(), 1);
    }

    function testCreatePollMaximumChoices() public {
        string[] memory maxChoices = new string[](10);
        for (uint i = 0; i < 10; i++) {
            maxChoices[i] = string(abi.encodePacked("Choice", vm.toString(i)));
        }

        pollConductor.createPoll(TEST_STATEMENT, maxChoices, TEST_DURATION);
        assertEq(pollConductor.pollsCreated(), 1);
    }

    function testCreateMultiplePolls() public {
        pollConductor.createPoll("Poll 1", testChoices, TEST_DURATION);
        pollConductor.createPoll("Poll 2", testChoices, TEST_DURATION);
        pollConductor.createPoll("Poll 3", testChoices, TEST_DURATION);

        assertEq(pollConductor.pollsCreated(), 3);
    }

    // ===== VOTE TESTS =====

    function testVoteSuccess() public {
        pollConductor.createPoll(TEST_STATEMENT, testChoices, TEST_DURATION);

        vm.expectEmit(true, true, false, true);
        emit PollVoted(1, user1, 1);

        vm.prank(user1);
        pollConductor.vote(1, 0);

        assertTrue(pollConductor.hasVotedForPollId(1, user1));
        assertEq(pollConductor.choiceVotedForPollId(1, user1), 1);

        (, , , , , , uint256[] memory votes, uint256 totalVotes) = pollConductor
            .getPollDetails(1);
        assertEq(votes[0], 1);
        assertEq(votes[1], 0);
        assertEq(votes[2], 0);
        assertEq(totalVotes, 1);
    }

    function testVoteMultipleChoices() public {
        pollConductor.createPoll(TEST_STATEMENT, testChoices, TEST_DURATION);

        vm.prank(user1);
        pollConductor.vote(1, 0);

        vm.prank(user2);
        pollConductor.vote(1, 1);

        vm.prank(user3);
        pollConductor.vote(1, 2);

        (, , , , , , uint256[] memory votes, uint256 totalVotes) = pollConductor
            .getPollDetails(1);
        assertEq(votes[0], 1);
        assertEq(votes[1], 1);
        assertEq(votes[2], 1);
        assertEq(totalVotes, 3);
    }

    function testVoteNonExistentPoll() public {
        vm.expectRevert(PollConductorV1.NonExistentPollId.selector);
        pollConductor.vote(999, 0);
    }

    function testVoteVoidedPoll() public {
        pollConductor.createPoll(TEST_STATEMENT, testChoices, TEST_DURATION);
        pollConductor.deemPollVoid(1);

        vm.prank(user1);
        vm.expectRevert(PollConductorV1.PollVoidedForPollId.selector);
        pollConductor.vote(1, 0);
    }

    function testVoteIncorrectChoiceIndex() public {
        pollConductor.createPoll(TEST_STATEMENT, testChoices, TEST_DURATION);

        vm.prank(user1);
        vm.expectRevert(PollConductorV1.IncorrectChoiceIndex.selector);
        pollConductor.vote(1, 3); // Only 0, 1, 2 are valid
    }

    function testVoteEndedPoll() public {
        pollConductor.createPoll(TEST_STATEMENT, testChoices, 1 minutes);

        vm.warp(block.timestamp + 2 minutes);

        vm.prank(user1);
        vm.expectRevert(PollConductorV1.PollEndedForPollId.selector);
        pollConductor.vote(1, 0);
    }

    function testVoteDoublePrevention() public {
        pollConductor.createPoll(TEST_STATEMENT, testChoices, TEST_DURATION);

        vm.startPrank(user1);
        pollConductor.vote(1, 0);

        vm.expectRevert(PollConductorV1.CallerVotedForPollId.selector);
        pollConductor.vote(1, 1);
        vm.stopPrank();
    }

    function testVoteAtExactEndTime() public {
        pollConductor.createPoll(TEST_STATEMENT, testChoices, 1 minutes);

        vm.warp(block.timestamp + 1 minutes + 1); // After end time

        vm.prank(user1);
        vm.expectRevert(PollConductorV1.PollEndedForPollId.selector);
        pollConductor.vote(1, 0);
    }

    function testVoteJustBeforeEndTime() public {
        pollConductor.createPoll(TEST_STATEMENT, testChoices, 1 minutes);

        vm.warp(block.timestamp + 1 minutes - 1); // Just before end time

        vm.prank(user1);
        pollConductor.vote(1, 0);

        assertTrue(pollConductor.hasVotedForPollId(1, user1));
    }

    // ===== UPDATE POLL END TIME TESTS =====

    function testUpdatePollEndTimeSuccess() public {
        pollConductor.createPoll(TEST_STATEMENT, testChoices, 1 days);

        vm.expectEmit(true, false, false, true);
        emit PollEndTimeUpdated(
            1,
            uint64(block.timestamp + 1 days),
            uint64(block.timestamp + 2 days)
        );

        pollConductor.updatePollEndTime(1, 2 days);

        (, , uint64 endTime, , , , , ) = pollConductor.getPollDetails(1);
        assertEq(endTime, block.timestamp + 2 days);
    }

    function testUpdatePollEndTimeByPollCreator() public {
        vm.prank(user1);
        pollConductor.createPoll(TEST_STATEMENT, testChoices, 1 days);

        vm.prank(user1);
        pollConductor.updatePollEndTime(1, 2 days);

        (, , uint64 endTime, , , , , ) = pollConductor.getPollDetails(1);
        assertEq(endTime, block.timestamp + 2 days);
    }

    function testUpdatePollEndTimeVoidedPoll() public {
        pollConductor.createPoll(TEST_STATEMENT, testChoices, TEST_DURATION);
        pollConductor.deemPollVoid(1);

        vm.expectRevert(PollConductorV1.PollVoidedForPollId.selector);
        pollConductor.updatePollEndTime(1, 2 days);
    }

    function testUpdatePollEndTimeEndedPoll() public {
        pollConductor.createPoll(TEST_STATEMENT, testChoices, 1 minutes);

        vm.warp(block.timestamp + 2 minutes);

        vm.expectRevert(PollConductorV1.PollEndedForPollId.selector);
        pollConductor.updatePollEndTime(1, 2 days);
    }

    function testUpdatePollEndTimeCannotShorten() public {
        pollConductor.createPoll(TEST_STATEMENT, testChoices, 2 days);

        vm.expectRevert(PollConductorV1.PollDurationCannotBeShortened.selector);
        pollConductor.updatePollEndTime(1, 1 days);
    }

    function testUpdatePollEndTimeExceedsMaximum() public {
        pollConductor.createPoll(TEST_STATEMENT, testChoices, 1 days);

        vm.expectRevert(
            abi.encodeWithSelector(
                PollConductorV1.NewDurationOutOfBounds.selector,
                366 days,
                365 days
            )
        );
        pollConductor.updatePollEndTime(1, 366 days);
    }

    function testUpdatePollEndTimeAtExactEndTime() public {
        pollConductor.createPoll(TEST_STATEMENT, testChoices, 1 minutes);

        vm.warp(block.timestamp + 1 minutes); // Exactly at end time

        vm.expectRevert(PollConductorV1.PollEndedForPollId.selector);
        pollConductor.updatePollEndTime(1, 2 days);
    }

    function testUpdatePollEndTimeJustBeforeEndTime() public {
        pollConductor.createPoll(TEST_STATEMENT, testChoices, 1 minutes);

        uint64 originalStartTime = uint64(block.timestamp);

        vm.warp(block.timestamp + 1 minutes - 1); // Just before end time

        pollConductor.updatePollEndTime(1, 2 days);

        (, , uint64 endTime, , , , , ) = pollConductor.getPollDetails(1);
        assertEq(endTime, originalStartTime + 2 days);
    }

    // ===== DEEM POLL VOID TESTS =====

    function testDeemPollVoidSuccess() public {
        pollConductor.createPoll(TEST_STATEMENT, testChoices, TEST_DURATION);

        vm.expectEmit(true, false, false, true);
        emit PollDeemedVoid(1);

        pollConductor.deemPollVoid(1);

        (, , , bool isVoid, , , , ) = pollConductor.getPollDetails(1);
        assertTrue(isVoid);
    }

    function testDeemPollVoidByPollCreator() public {
        vm.prank(user1);
        pollConductor.createPoll(TEST_STATEMENT, testChoices, TEST_DURATION);

        vm.prank(user1);
        pollConductor.deemPollVoid(1);

        (, , , bool isVoid, , , , ) = pollConductor.getPollDetails(1);
        assertTrue(isVoid);
    }

    function testDeemPollVoidAlreadyVoided() public {
        pollConductor.createPoll(TEST_STATEMENT, testChoices, TEST_DURATION);
        pollConductor.deemPollVoid(1);

        vm.expectRevert(PollConductorV1.PollVoidedForPollId.selector);
        pollConductor.deemPollVoid(1);
    }

    // ===== UPDATE MAXIMUM CHOICES TESTS =====

    function testUpdateMaximumChoicesSuccess() public {
        vm.expectEmit(false, false, false, true);
        emit MaximumChoicesUpdated(15);

        pollConductor.updateMaximumChoices(15);
        assertEq(pollConductor.maximumChoices(), 15);
    }

    function testUpdateMaximumChoicesMinimum() public {
        pollConductor.updateMaximumChoices(2);
        assertEq(pollConductor.maximumChoices(), 2);
    }

    function testUpdateMaximumChoicesLessThanTwo() public {
        vm.expectRevert(PollConductorV1.MaximumChoicesLessThanTwo.selector);
        pollConductor.updateMaximumChoices(1);
    }

    function testUpdateMaximumChoicesZero() public {
        vm.expectRevert(PollConductorV1.MaximumChoicesLessThanTwo.selector);
        pollConductor.updateMaximumChoices(0);
    }

    // ===== UPDATE MAXIMUM DURATION TESTS =====

    function testUpdateMaximumDurationSuccess() public {
        vm.expectEmit(false, false, false, true);
        emit MaximumDurationUpdated(30 days);

        pollConductor.updateMaximumDuration(30 days);
        assertEq(pollConductor.maximumDuration(), 30 days);
    }

    function testUpdateMaximumDurationMinimum() public {
        pollConductor.updateMaximumDuration(1 minutes);
        assertEq(pollConductor.maximumDuration(), 1 minutes);
    }

    function testUpdateMaximumDurationLessThanOneMinute() public {
        vm.expectRevert(
            PollConductorV1.MaximumDurationLesserThanOneMinute.selector
        );
        pollConductor.updateMaximumDuration(59);
    }

    function testUpdateMaximumDurationZero() public {
        vm.expectRevert(
            PollConductorV1.MaximumDurationLesserThanOneMinute.selector
        );
        pollConductor.updateMaximumDuration(0);
    }

    // ===== TRANSFER OWNERSHIP TESTS =====

    function testTransferOwnershipSuccess() public {
        vm.expectEmit(true, true, false, true);
        emit OwnershipTransferred(owner, newOwner);

        pollConductor.transferOwnership(newOwner);
        assertEq(pollConductor.owner(), newOwner);
    }

    function testTransferOwnershipToZeroAddress() public {
        pollConductor.transferOwnership(address(0));
        assertEq(pollConductor.owner(), address(0));
    }

    function testTransferOwnershipNewOwnerCanUseOwnerFunctions() public {
        pollConductor.transferOwnership(newOwner);

        vm.prank(newOwner);
        pollConductor.updateMaximumChoices(5);
        assertEq(pollConductor.maximumChoices(), 5);
    }

    function testTransferOwnershipOldOwnerLosesAccess() public {
        pollConductor.transferOwnership(newOwner);

        vm.expectRevert(PollConductorV1.CallerNotOwner.selector);
        pollConductor.updateMaximumChoices(5);
    }

    // ===== PAUSE/UNPAUSE TESTS =====

    function testPauseUserPollCreationSuccess() public {
        vm.expectEmit(false, false, false, true);
        emit UserPollCreationPaused();

        pollConductor.pauseUserPollCreation();
        assertTrue(pollConductor._isUserPollCreationPaused());
    }

    function testUnpauseUserPollCreationSuccess() public {
        pollConductor.pauseUserPollCreation();

        vm.expectEmit(false, false, false, true);
        emit UserPollCreationUnpaused();

        pollConductor.unpauseUserPollCreation();
        assertFalse(pollConductor._isUserPollCreationPaused());
    }

    function testPauseBlocksNonOwnerPollCreation() public {
        pollConductor.pauseUserPollCreation();

        vm.prank(user1);
        vm.expectRevert(PollConductorV1.PollCreationPaused.selector);
        pollConductor.createPoll(TEST_STATEMENT, testChoices, TEST_DURATION);
    }

    function testPauseDoesNotBlockOwnerPollCreation() public {
        pollConductor.pauseUserPollCreation();

        pollConductor.createPoll(TEST_STATEMENT, testChoices, TEST_DURATION);
        assertEq(pollConductor.pollsCreated(), 1);
    }

    function testUnpauseAllowsNonOwnerPollCreation() public {
        pollConductor.pauseUserPollCreation();
        pollConductor.unpauseUserPollCreation();

        vm.prank(user1);
        pollConductor.createPoll(TEST_STATEMENT, testChoices, TEST_DURATION);
        assertEq(pollConductor.pollsCreated(), 1);
    }

    // ===== VIEW FUNCTION TESTS =====

    function testHasVotedForPollIdTrue() public {
        pollConductor.createPoll(TEST_STATEMENT, testChoices, TEST_DURATION);

        vm.prank(user1);
        pollConductor.vote(1, 0);

        assertTrue(pollConductor.hasVotedForPollId(1, user1));
    }

    function testHasVotedForPollIdFalse() public {
        pollConductor.createPoll(TEST_STATEMENT, testChoices, TEST_DURATION);

        assertFalse(pollConductor.hasVotedForPollId(1, user1));
    }

    function testChoiceVotedForPollIdWithVote() public {
        pollConductor.createPoll(TEST_STATEMENT, testChoices, TEST_DURATION);

        vm.prank(user1);
        pollConductor.vote(1, 2); // Vote for index 2

        assertEq(pollConductor.choiceVotedForPollId(1, user1), 3); // Returns 1-based
    }

    function testChoiceVotedForPollIdWithoutVote() public {
        pollConductor.createPoll(TEST_STATEMENT, testChoices, TEST_DURATION);

        assertEq(pollConductor.choiceVotedForPollId(1, user1), 0);
    }

    function testPollsCreatedByAddressEmpty() public view {
        uint256[] memory pollIds = pollConductor.pollsCreatedByAddress(user1);
        assertEq(pollIds.length, 0);
    }

    function testPollsCreatedByAddressWithPolls() public {
        vm.startPrank(user1);
        pollConductor.createPoll("Poll 1", testChoices, TEST_DURATION);
        pollConductor.createPoll("Poll 2", testChoices, TEST_DURATION);
        vm.stopPrank();

        pollConductor.createPoll("Poll 3", testChoices, TEST_DURATION); // Different creator

        uint256[] memory pollIds = pollConductor.pollsCreatedByAddress(user1);
        assertEq(pollIds.length, 2);
        assertEq(pollIds[0], 1);
        assertEq(pollIds[1], 2);
    }

    function testPollsVotedByAddressEmpty() public {
        pollConductor.createPoll(TEST_STATEMENT, testChoices, TEST_DURATION);

        uint256[] memory pollIds = pollConductor.pollsVotedByAddress(user1);
        assertEq(pollIds.length, 0);
    }

    function testPollsVotedByAddressWithVotes() public {
        pollConductor.createPoll("Poll 1", testChoices, TEST_DURATION);
        pollConductor.createPoll("Poll 2", testChoices, TEST_DURATION);
        pollConductor.createPoll("Poll 3", testChoices, TEST_DURATION);

        vm.startPrank(user1);
        pollConductor.vote(1, 0);
        pollConductor.vote(3, 1);
        vm.stopPrank();

        uint256[] memory pollIds = pollConductor.pollsVotedByAddress(user1);
        assertEq(pollIds.length, 2);
        assertEq(pollIds[0], 1);
        assertEq(pollIds[1], 3);
    }

    function testPollsNotVotedByAddressEmpty() public {
        pollConductor.createPoll("Poll 1", testChoices, TEST_DURATION);
        pollConductor.createPoll("Poll 2", testChoices, TEST_DURATION);

        vm.startPrank(user1);
        pollConductor.vote(1, 0);
        pollConductor.vote(2, 1);
        vm.stopPrank();

        uint256[] memory pollIds = pollConductor.pollsNotVotedByAddress(user1);
        assertEq(pollIds.length, 0);
    }

    function testPollsNotVotedByAddressWithUnvotedPolls() public {
        pollConductor.createPoll("Poll 1", testChoices, TEST_DURATION);
        pollConductor.createPoll("Poll 2", testChoices, TEST_DURATION);
        pollConductor.createPoll("Poll 3", testChoices, TEST_DURATION);

        vm.prank(user1);
        pollConductor.vote(2, 0);

        uint256[] memory pollIds = pollConductor.pollsNotVotedByAddress(user1);
        assertEq(pollIds.length, 2);
        assertEq(pollIds[0], 1);
        assertEq(pollIds[1], 3);
    }

    function testGetPollDetailsNonExistentPoll() public view {
        // This should return empty data for non-existent poll
        (
            address creator,
            uint64 startTime,
            uint64 endTime,
            bool isVoid,
            string memory statement,
            string[] memory choices,
            uint256[] memory votes,
            uint256 totalVotes
        ) = pollConductor.getPollDetails(999);

        assertEq(creator, address(0));
        assertEq(startTime, 0);
        assertEq(endTime, 0);
        assertFalse(isVoid);
        assertEq(bytes(statement).length, 0);
        assertEq(choices.length, 0);
        assertEq(votes.length, 0);
        assertEq(totalVotes, 0);
    }

    function testGetPollDetailsWithVotes() public {
        pollConductor.createPoll(TEST_STATEMENT, testChoices, TEST_DURATION);

        vm.prank(user1);
        pollConductor.vote(1, 0);

        vm.prank(user2);
        pollConductor.vote(1, 0);

        vm.prank(user3);
        pollConductor.vote(1, 1);

        (, , , , , , uint256[] memory votes, uint256 totalVotes) = pollConductor
            .getPollDetails(1);

        assertEq(votes[0], 2);
        assertEq(votes[1], 1);
        assertEq(votes[2], 0);
        assertEq(totalVotes, 3);
    }

    // ===== INTEGRATION TESTS =====

    function testCompletePollingWorkflow() public {
        // Create poll
        pollConductor.createPoll(TEST_STATEMENT, testChoices, TEST_DURATION);

        // Multiple users vote
        vm.prank(user1);
        pollConductor.vote(1, 0);

        vm.prank(user2);
        pollConductor.vote(1, 1);

        vm.prank(user3);
        pollConductor.vote(1, 2);

        // Check results
        (, , , , , , uint256[] memory votes, uint256 totalVotes) = pollConductor
            .getPollDetails(1);
        assertEq(votes[0], 1);
        assertEq(votes[1], 1);
        assertEq(votes[2], 1);
        assertEq(totalVotes, 3);

        // Extend poll
        pollConductor.updatePollEndTime(1, 2 days);

        // More voting after extension
        address user4 = address(0x5);
        vm.prank(user4);
        pollConductor.vote(1, 0);

        // Final check
        (, , , , , , votes, totalVotes) = pollConductor.getPollDetails(1);
        assertEq(votes[0], 2);
        assertEq(totalVotes, 4);
    }

    function testOwnershipTransferWorkflow() public {
        // Original owner creates poll
        pollConductor.createPoll(TEST_STATEMENT, testChoices, TEST_DURATION);

        // Transfer ownership
        pollConductor.transferOwnership(newOwner);

        // New owner can manage poll
        vm.prank(newOwner);
        pollConductor.deemPollVoid(1);

        // Old owner cannot manage
        vm.expectRevert(PollConductorV1.CallerNotOwner.selector);
        pollConductor.updateMaximumChoices(5);

        // New owner can use admin functions
        vm.prank(newOwner);
        pollConductor.updateMaximumChoices(5);
        assertEq(pollConductor.maximumChoices(), 5);
    }

    function testPauseUnpauseWorkflow() public {
        // Normal creation works
        vm.prank(user1);
        pollConductor.createPoll(TEST_STATEMENT, testChoices, TEST_DURATION);

        // Pause creation
        pollConductor.pauseUserPollCreation();

        // User cannot create
        vm.prank(user1);
        vm.expectRevert(PollConductorV1.PollCreationPaused.selector);
        pollConductor.createPoll(TEST_STATEMENT, testChoices, TEST_DURATION);

        // Owner can still create
        pollConductor.createPoll(TEST_STATEMENT, testChoices, TEST_DURATION);

        // Unpause
        pollConductor.unpauseUserPollCreation();

        // User can create again
        vm.prank(user1);
        pollConductor.createPoll(TEST_STATEMENT, testChoices, TEST_DURATION);

        assertEq(pollConductor.pollsCreated(), 3);
    }

    // ===== FUZZ TESTS =====

    function testFuzzCreatePollChoicesLength(uint8 choicesLength) public {
        vm.assume(choicesLength >= 2 && choicesLength <= 10);

        string[] memory choices = new string[](choicesLength);
        for (uint i = 0; i < choicesLength; i++) {
            choices[i] = string(abi.encodePacked("Choice", vm.toString(i)));
        }

        pollConductor.createPoll(TEST_STATEMENT, choices, TEST_DURATION);
        assertEq(pollConductor.pollsCreated(), 1);
    }

    function testFuzzCreatePollDuration(uint32 duration) public {
        vm.assume(duration >= 1 minutes && duration <= 365 days);

        pollConductor.createPoll(TEST_STATEMENT, testChoices, duration);
        assertEq(pollConductor.pollsCreated(), 1);
    }

    function testFuzzVoteChoiceIndex(uint16 choiceIndex) public {
        pollConductor.createPoll(TEST_STATEMENT, testChoices, TEST_DURATION);

        if (choiceIndex < testChoices.length) {
            // Valid choice index
            vm.prank(user1);
            pollConductor.vote(1, choiceIndex);
            assertTrue(pollConductor.hasVotedForPollId(1, user1));
            assertEq(
                pollConductor.choiceVotedForPollId(1, user1),
                choiceIndex + 1
            );
        } else {
            // Invalid choice index - should revert
            vm.prank(user1);
            vm.expectRevert(PollConductorV1.IncorrectChoiceIndex.selector);
            pollConductor.vote(1, choiceIndex);
        }
    }

    function testFuzzUpdateMaximumChoices(uint16 newMaximum) public {
        if (newMaximum >= 2) {
            pollConductor.updateMaximumChoices(newMaximum);
            assertEq(pollConductor.maximumChoices(), newMaximum);
        } else {
            vm.expectRevert(PollConductorV1.MaximumChoicesLessThanTwo.selector);
            pollConductor.updateMaximumChoices(newMaximum);
        }
    }

    function testFuzzUpdateMaximumDuration(uint32 newMaximum) public {
        if (newMaximum >= 1 minutes) {
            pollConductor.updateMaximumDuration(newMaximum);
            assertEq(pollConductor.maximumDuration(), newMaximum);
        } else {
            vm.expectRevert(
                PollConductorV1.MaximumDurationLesserThanOneMinute.selector
            );
            pollConductor.updateMaximumDuration(newMaximum);
        }
    }

    // ===== EDGE CASE TESTS =====

    function testVotingAtBoundaryTimes() public {
        pollConductor.createPoll(TEST_STATEMENT, testChoices, 1 hours);

        // Vote right at start
        vm.prank(user1);
        pollConductor.vote(1, 0);

        // Vote near end
        vm.warp(block.timestamp + 1 hours - 1);
        vm.prank(user2);
        pollConductor.vote(1, 1);

        // Cannot vote after end
        vm.warp(block.timestamp + 2);
        vm.prank(user3);
        vm.expectRevert(PollConductorV1.PollEndedForPollId.selector);
        pollConductor.vote(1, 2);
    }

    function testMaximumChoicesEdgeCases() public {
        // Test at maximum
        pollConductor.updateMaximumChoices(type(uint16).max);
        assertEq(pollConductor.maximumChoices(), type(uint16).max);

        // Test at minimum
        pollConductor.updateMaximumChoices(2);
        assertEq(pollConductor.maximumChoices(), 2);
    }

    function testMaximumDurationEdgeCases() public {
        // Test at maximum uint32
        pollConductor.updateMaximumDuration(type(uint32).max);
        assertEq(pollConductor.maximumDuration(), type(uint32).max);

        // Test at minimum
        pollConductor.updateMaximumDuration(1 minutes);
        assertEq(pollConductor.maximumDuration(), 1 minutes);
    }

    function testPollIdBoundaryChecks() public {
        // Check poll ID 0
        vm.expectRevert(PollConductorV1.NonExistentPollId.selector);
        pollConductor.vote(0, 0);

        // Check poll ID beyond created
        vm.expectRevert(PollConductorV1.NonExistentPollId.selector);
        pollConductor.vote(1, 0);

        // Create poll and test valid ID
        pollConductor.createPoll(TEST_STATEMENT, testChoices, TEST_DURATION);

        vm.prank(user1);
        pollConductor.vote(1, 0); // Should work

        // Test ID beyond created again
        vm.expectRevert(PollConductorV1.NonExistentPollId.selector);
        pollConductor.vote(2, 0);
    }

    function testEmptyStringHandling() public {
        string[] memory emptyChoices = new string[](2);
        emptyChoices[0] = "";
        emptyChoices[1] = "";

        pollConductor.createPoll("", emptyChoices, TEST_DURATION);

        (
            ,
            ,
            ,
            ,
            string memory statement,
            string[] memory choices,
            ,

        ) = pollConductor.getPollDetails(1);
        assertEq(bytes(statement).length, 0);
        assertEq(bytes(choices[0]).length, 0);
        assertEq(bytes(choices[1]).length, 0);
    }
}
