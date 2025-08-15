import { useState, useEffect } from "react";
import { useReadContract, useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { config } from "./config";
import { sepolia } from "viem/chains";

export const PollDetailsById = ({ pollId }) => {
    const { data: pollIdDetails, isLoading, error, refetch: refetchPollIdDetails } = useReadContract({
        address: config.contractAddress,
        abi: config.contractABI,
        functionName: "getPollDetails",
        args: [pollId ? pollId : 0],
        chainId: sepolia.id
    });

    // console.log(typeof pollIdDetails[3])
    const connectedAccount = useAccount();

    const { data: hasAddressVoted, refetch: refetchHasAddressVoted } = useReadContract({
        address: config.contractAddress,
        abi: config.contractABI,
        functionName: "hasVotedForPollId",
        args: [(pollId ? pollId : 0), (connectedAccount.address ? connectedAccount.address : "0x0000000000000000000000000000000000000000")],
        chainId: sepolia.id
    });

    const { data: choiceVoted, refetch: refetchChoiceVoted } = useReadContract({
        address: config.contractAddress,
        abi: config.contractABI,
        functionName: "choiceVotedForPollId",
        args: [(pollId ? pollId : 0), (connectedAccount.address ? connectedAccount.address : "0x0000000000000000000000000000000000000000")],
        chainId: sepolia.id
    });

    const [clickedChoice, setClickedChoice] = useState(null);
    const [voteTxnHash, setVoteTxnHash] = useState(null);
    const castVote = useWriteContract();
    const [pollTimeLeft, setPollTimeLeft] = useState(["--", "--", "--", "--"]);

    useEffect(() => {
        if (!pollIdDetails) return; // Don't start if details aren't loaded

        const updateTime = () => {
            const now = Date.now();
            const endTime = Number(pollIdDetails[2]) * 1000;
            const diff = endTime - now;

            if (diff <= 0) {
                setPollTimeLeft(0);
                return;
            }

            let totalSeconds = Math.floor(diff / 1000);
            let days = String(Math.floor(totalSeconds / (3600 * 24)))
            totalSeconds %= (3600 * 24);
            let hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
            totalSeconds %= 3600;
            let minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
            let seconds = String(totalSeconds % 60).padStart(2, '0');
            setPollTimeLeft([days, hours, minutes, seconds]);
        }

        updateTime();
        const interval = setInterval(updateTime, 1000);

        return () => clearInterval(interval); // <-- Cleanup on unmount or pollId changes
    }, [pollIdDetails]);



    const handleVote = async (_pollId, _choice) => {
        try {
            let updated = Array(pollIdDetails[5].length).fill(false);
            updated[_choice] = true;
            setClickedChoice(updated);
            const data = await castVote.writeContractAsync({
                address: config.contractAddress,
                abi: config.contractABI,
                functionName: "vote",
                args: [_pollId, _choice]
            });
            setVoteTxnHash(data);
        } catch (err) {
            console.log(err);
        }
    }

    const waitForVoteTxn = useWaitForTransactionReceipt({
        hash: voteTxnHash,
        query: { enabled: Boolean(voteTxnHash) }
    })

    useEffect(() => {
        if (waitForVoteTxn.isSuccess) {
            refetchHasAddressVoted();
            refetchChoiceVoted();
            refetchPollIdDetails();
        }
    }, [waitForVoteTxn.isSuccess, refetchHasAddressVoted, refetchChoiceVoted, refetchPollIdDetails])

    if (isLoading || !pollIdDetails) {
        return (
            <div className="container-fluid d-flex align-items-center justify-content-center gap-2">
                <span className="mb-3 mt-4 fw-bold fs-5">Loading polls</span>
                <div className="spinner-border spinner-border-sm text-black mb-3 mt-4" role="status" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="container-fluid d-flex flex-column align-items-center justify-content-center">
                <h5 className="mb-3 mt-4 fw-bold">Error loading polls...</h5>
            </div>
        );
    }

    return (
        <div id={pollId} className="container-fluid d-flex flex-column align-items-center justify-content-center">
            <h5 className="fw-bold text-center text-wrap w-75 px-3 mb-4">
                {pollId}. {pollIdDetails[4]}
            </h5>
            <div className="btn-group-vertical gap-2" style={{ width: "65%" }} role="group" aria-label="Vertical button group">
                {Array.from({ length: pollIdDetails[5].length }).map((_, index) => (
                    <button key={index}
                        className="btn w-100 fw-bold p-2 my-2 rounded-5 custom-hover text-center text-wrap"
                        style={{ backgroundColor: "#9e42f5", color: "white" }}
                        onClick={() => handleVote(pollId, index)}
                        disabled={connectedAccount.isDisconnected || !pollTimeLeft || castVote.isPending || waitForVoteTxn.isLoading || hasAddressVoted || pollIdDetails[3]}>
                        {(castVote.isPending && clickedChoice[index]) || (waitForVoteTxn.isLoading && clickedChoice[index]) ? (
                            <div className="d-flex align-items-center justify-content-center gap-2">
                                <span>{pollIdDetails[5][index]}</span>
                                <div className="spinner-border spinner-border-sm text-light" role="status" />
                            </div>
                        ) : connectedAccount.address && hasAddressVoted && !pollIdDetails[3] ? (
                            `${pollIdDetails[5][index]} : ${parseInt((pollIdDetails[6][index]).toString(), 10) && parseInt((pollIdDetails[7]).toString(), 10) ? ((parseInt((pollIdDetails[6][index]).toString(), 10) * 100) / parseInt((pollIdDetails[7]).toString(), 10)) : 0}% votes ${choiceVoted && (parseInt(choiceVoted.toString(), 10) - 1).toString() === index.toString() ? "(Your vote)" : ""}`
                        ) : connectedAccount.address && !hasAddressVoted && !pollTimeLeft && !pollIdDetails[3] ? (
                            `${pollIdDetails[5][index]} : ${parseInt((pollIdDetails[6][index]).toString(), 10) && parseInt((pollIdDetails[7]).toString(), 10) ? ((parseInt((pollIdDetails[6][index]).toString(), 10) * 100) / parseInt((pollIdDetails[7]).toString(), 10)) : 0}% votes`
                        ) : connectedAccount.isDisconnected && !pollTimeLeft && !pollIdDetails[3] ? (
                            `${pollIdDetails[5][index]} : ${parseInt((pollIdDetails[6][index]).toString(), 10) && parseInt((pollIdDetails[7]).toString(), 10) ? ((parseInt((pollIdDetails[6][index]).toString(), 10) * 100) / parseInt((pollIdDetails[7]).toString(), 10)) : 0}% votes`
                        ) : pollIdDetails[3] ? (
                            pollIdDetails[5][index]
                        ) : pollIdDetails[5][index]}
                    </button>
                ))}
            </div>
            <h6 className="fw-bold mt-4"> Time left: {!pollTimeLeft || pollIdDetails[3] ? "0:00:00:00" : pollTimeLeft.join(":")} </h6>
            {connectedAccount.address && !pollTimeLeft && !pollIdDetails[3] ? (
                <div className="mt-3 fw-semibold">
                    Poll ended
                </div>
            ) : connectedAccount.isDisconnected && !pollTimeLeft && !pollIdDetails[3] ? (
                <div className="mt-3 fw-semibold">
                    Poll ended
                </div>
            ) : connectedAccount.isDisconnected && !pollIdDetails[3] ? (
                <div className="mt-3 fw-semibold text-center text-wrap w-75">
                    Please connect your wallet to participate in the poll
                </div>
            ) : pollIdDetails[3] ? (
                <div className="mt-3 fw-semibold">
                    Poll is deemed void
                </div>
            ) : null}
        </div>

    );
};
