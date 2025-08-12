export const config = {
	contractAddress: "0xC5A14f695fD8E691f1D27D5477b4a4c850E5ea16",
	contractABI: [
		{
			"inputs": [],
			"stateMutability": "nonpayable",
			"type": "constructor"
		},
		{
			"inputs": [],
			"name": "CallerNotOwner",
			"type": "error"
		},
		{
			"inputs": [],
			"name": "CallerNotPollCreatorNorOwner",
			"type": "error"
		},
		{
			"inputs": [],
			"name": "CallerVotedForPollId",
			"type": "error"
		},
		{
			"inputs": [
				{
					"internalType": "uint16",
					"name": "choicesAdded",
					"type": "uint16"
				},
				{
					"internalType": "uint16",
					"name": "minimumChoicesAllowed",
					"type": "uint16"
				},
				{
					"internalType": "uint16",
					"name": "maximumChoicesAllowed",
					"type": "uint16"
				}
			],
			"name": "ChoicesOutOfBounds",
			"type": "error"
		},
		{
			"inputs": [
				{
					"internalType": "string",
					"name": "_statement",
					"type": "string"
				},
				{
					"internalType": "string[]",
					"name": "_choices",
					"type": "string[]"
				},
				{
					"internalType": "uint32",
					"name": "_duration",
					"type": "uint32"
				}
			],
			"name": "createPoll",
			"outputs": [],
			"stateMutability": "nonpayable",
			"type": "function"
		},
		{
			"inputs": [
				{
					"internalType": "uint256",
					"name": "_pollId",
					"type": "uint256"
				}
			],
			"name": "deemPollVoid",
			"outputs": [],
			"stateMutability": "nonpayable",
			"type": "function"
		},
		{
			"inputs": [
				{
					"internalType": "uint32",
					"name": "durationAdded",
					"type": "uint32"
				},
				{
					"internalType": "uint32",
					"name": "minimumDurationAllowed",
					"type": "uint32"
				},
				{
					"internalType": "uint32",
					"name": "maximumDurationAllowed",
					"type": "uint32"
				}
			],
			"name": "DurationOutOfBounds",
			"type": "error"
		},
		{
			"inputs": [],
			"name": "IncorrectChoiceIndex",
			"type": "error"
		},
		{
			"inputs": [],
			"name": "MaximumChoicesLessThanTwo",
			"type": "error"
		},
		{
			"inputs": [],
			"name": "MaximumDurationLesserThanOneMinute",
			"type": "error"
		},
		{
			"inputs": [
				{
					"internalType": "uint32",
					"name": "newDurationAdded",
					"type": "uint32"
				},
				{
					"internalType": "uint32",
					"name": "maximumDurationAllowed",
					"type": "uint32"
				}
			],
			"name": "NewDurationOutOfBounds",
			"type": "error"
		},
		{
			"inputs": [],
			"name": "NonExistentPollId",
			"type": "error"
		},
		{
			"inputs": [],
			"name": "pauseUserPollCreation",
			"outputs": [],
			"stateMutability": "nonpayable",
			"type": "function"
		},
		{
			"inputs": [],
			"name": "PollCreationPaused",
			"type": "error"
		},
		{
			"inputs": [],
			"name": "PollDurationCannotBeShortened",
			"type": "error"
		},
		{
			"inputs": [],
			"name": "PollEndedForPollId",
			"type": "error"
		},
		{
			"inputs": [],
			"name": "PollVoidedForPollId",
			"type": "error"
		},
		{
			"inputs": [
				{
					"internalType": "address",
					"name": "_newOwner",
					"type": "address"
				}
			],
			"name": "transferOwnership",
			"outputs": [],
			"stateMutability": "nonpayable",
			"type": "function"
		},
		{
			"inputs": [],
			"name": "unpauseUserPollCreation",
			"outputs": [],
			"stateMutability": "nonpayable",
			"type": "function"
		},
		{
			"inputs": [
				{
					"internalType": "uint16",
					"name": "_newMaximumChoices",
					"type": "uint16"
				}
			],
			"name": "updateMaximumChoices",
			"outputs": [],
			"stateMutability": "nonpayable",
			"type": "function"
		},
		{
			"inputs": [
				{
					"internalType": "uint32",
					"name": "_newMaximumDuration",
					"type": "uint32"
				}
			],
			"name": "updateMaximumDuration",
			"outputs": [],
			"stateMutability": "nonpayable",
			"type": "function"
		},
		{
			"inputs": [
				{
					"internalType": "uint256",
					"name": "_pollId",
					"type": "uint256"
				},
				{
					"internalType": "uint32",
					"name": "_newDuration",
					"type": "uint32"
				}
			],
			"name": "updatePollEndTime",
			"outputs": [],
			"stateMutability": "nonpayable",
			"type": "function"
		},
		{
			"inputs": [
				{
					"internalType": "uint256",
					"name": "_pollId",
					"type": "uint256"
				},
				{
					"internalType": "uint16",
					"name": "choiceIndex",
					"type": "uint16"
				}
			],
			"name": "vote",
			"outputs": [],
			"stateMutability": "nonpayable",
			"type": "function"
		},
		{
			"inputs": [],
			"name": "_isUserPollCreationPaused",
			"outputs": [
				{
					"internalType": "bool",
					"name": "",
					"type": "bool"
				}
			],
			"stateMutability": "view",
			"type": "function"
		},
		{
			"inputs": [
				{
					"internalType": "uint256",
					"name": "_pollId",
					"type": "uint256"
				},
				{
					"internalType": "address",
					"name": "_voter",
					"type": "address"
				}
			],
			"name": "choiceVotedForPollId",
			"outputs": [
				{
					"internalType": "uint16",
					"name": "choice",
					"type": "uint16"
				}
			],
			"stateMutability": "view",
			"type": "function"
		},
		{
			"inputs": [
				{
					"internalType": "uint256",
					"name": "_pollId",
					"type": "uint256"
				}
			],
			"name": "getPollDetails",
			"outputs": [
				{
					"internalType": "address",
					"name": "_creator",
					"type": "address"
				},
				{
					"internalType": "uint64",
					"name": "_startTime",
					"type": "uint64"
				},
				{
					"internalType": "uint64",
					"name": "_endTime",
					"type": "uint64"
				},
				{
					"internalType": "bool",
					"name": "_isVoid",
					"type": "bool"
				},
				{
					"internalType": "string",
					"name": "_statement",
					"type": "string"
				},
				{
					"internalType": "string[]",
					"name": "_choices",
					"type": "string[]"
				},
				{
					"internalType": "uint256[]",
					"name": "_votes",
					"type": "uint256[]"
				},
				{
					"internalType": "uint256",
					"name": "totalVotes",
					"type": "uint256"
				}
			],
			"stateMutability": "view",
			"type": "function"
		},
		{
			"inputs": [
				{
					"internalType": "uint256",
					"name": "_pollId",
					"type": "uint256"
				},
				{
					"internalType": "address",
					"name": "_voter",
					"type": "address"
				}
			],
			"name": "hasVotedForPollId",
			"outputs": [
				{
					"internalType": "bool",
					"name": "hasVoted",
					"type": "bool"
				}
			],
			"stateMutability": "view",
			"type": "function"
		},
		{
			"inputs": [],
			"name": "maximumChoices",
			"outputs": [
				{
					"internalType": "uint16",
					"name": "",
					"type": "uint16"
				}
			],
			"stateMutability": "view",
			"type": "function"
		},
		{
			"inputs": [],
			"name": "maximumDuration",
			"outputs": [
				{
					"internalType": "uint32",
					"name": "",
					"type": "uint32"
				}
			],
			"stateMutability": "view",
			"type": "function"
		},
		{
			"inputs": [],
			"name": "owner",
			"outputs": [
				{
					"internalType": "address",
					"name": "",
					"type": "address"
				}
			],
			"stateMutability": "view",
			"type": "function"
		},
		{
			"inputs": [],
			"name": "pollsCreated",
			"outputs": [
				{
					"internalType": "uint256",
					"name": "",
					"type": "uint256"
				}
			],
			"stateMutability": "view",
			"type": "function"
		},
		{
			"inputs": [
				{
					"internalType": "address",
					"name": "_creator",
					"type": "address"
				}
			],
			"name": "pollsCreatedByAddress",
			"outputs": [
				{
					"internalType": "uint256[]",
					"name": "pollIds",
					"type": "uint256[]"
				}
			],
			"stateMutability": "view",
			"type": "function"
		},
		{
			"inputs": [
				{
					"internalType": "address",
					"name": "_voter",
					"type": "address"
				}
			],
			"name": "pollsNotVotedByAddress",
			"outputs": [
				{
					"internalType": "uint256[]",
					"name": "pollIds",
					"type": "uint256[]"
				}
			],
			"stateMutability": "view",
			"type": "function"
		},
		{
			"inputs": [
				{
					"internalType": "address",
					"name": "_voter",
					"type": "address"
				}
			],
			"name": "pollsVotedByAddress",
			"outputs": [
				{
					"internalType": "uint256[]",
					"name": "pollIds",
					"type": "uint256[]"
				}
			],
			"stateMutability": "view",
			"type": "function"
		}
	]
}