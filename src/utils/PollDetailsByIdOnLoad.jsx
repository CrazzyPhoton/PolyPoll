import { useState, useEffect } from "react";
import { useReadContract, useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { config } from "./config";
import { sepolia } from "viem/chains";
import { BsThreeDotsVertical } from "react-icons/bs";
import { PollConfigModal } from "./PollConfigModal";

export const PollDetailsByIdOnLoad = ({ pollId, onLoaded }) => {
    const { data: pollIdDetails, isLoading, error, refetch: refetchPollIdDetails } = useReadContract({
        address: config.contractAddress,
        abi: config.contractABI,
        functionName: "getPollDetails",
        args: [pollId ? pollId : 0],
        chainId: sepolia.id
    });

    const { data: ownerAddress } = useReadContract({
        address: config.contractAddress,
        abi: config.contractABI,
        functionName: "owner",
        chainId: sepolia.id
    });

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
    const [showModal, setShowModal] = useState(false);
    const deemPollIdVoid = useWriteContract();
    const [deemPollIdVoidTxnHash, setDeemPollIdVoidTxnHash] = useState(null);

    const extendDuration = useWriteContract();
    const [durationDays, setDurationDays] = useState(0);
    const [durationHours, setDurationHours] = useState(0);
    const [durationMinutes, setDurationMinutes] = useState(0);
    const maxDays = useReadContract({
        address: config.contractAddress,
        abi: config.contractABI,
        functionName: "maximumDuration",
        chainId: sepolia.id
    });
    const [extendDurationTxnHash, setExtendDurationTxnHash] = useState(null);
    const [buttonText, setButtonText] = useState("Share");

    const maxDurationDays = maxDays.data ? (parseInt(maxDays.data.toString(), 10) / 86400) : 100;

    const computeMin = (details) => {
        if (!details) return 0;

        const now = Date.now();
        const endTime = Number(details[2]) * 1000;
        const diff = endTime - now;

        if (diff <= 0 || details[3]) return { days: "0", hours: "0", minutes: "0" };

        const startTime = Number(details[1]) * 1000;
        const orginalDuration = endTime - startTime;

        let totalSeconds = Math.floor(orginalDuration / 1000);
        let days = Math.floor(totalSeconds / (3600 * 24));
        totalSeconds %= (3600 * 24);
        let hours = Math.floor(totalSeconds / 3600);
        totalSeconds %= 3600;
        let minutes = Math.floor(totalSeconds / 60);

        return { days, hours, minutes };
    }

    const minObj = computeMin(pollIdDetails);

    useEffect(() => {
        if (pollIdDetails) {
            const min = computeMin(pollIdDetails);
            setDurationDays(min.days);
            setDurationHours(min.hours);
            setDurationMinutes(min.minutes);
        }
    }, [pollIdDetails]);

    const handleDurationDaysChange = (e) => {
        setDurationDays(parseInt(e.target.value, 10));
        if (parseInt(e.target.value, 10) === maxDurationDays) {
            setDurationHours(0);
            setDurationMinutes(0);
        }
        if (parseInt(e.target.value, 10) === minObj.days && durationHours < minObj.hours) {
            setDurationHours(minObj.hours);
            setDurationMinutes(minObj.minutes);
        }
    };

    const handleDurationHoursChange = (e) => {
        setDurationHours(parseInt(e.target.value, 10));
        if (parseInt(e.target.value, 10) === minObj.hours && durationDays === minObj.days && durationMinutes < minObj.minutes) {
            setDurationMinutes(minObj.minutes);
        }
    };

    const handleDurationMinutesChange = (e) => {
        setDurationMinutes(parseInt(e.target.value, 10));
    };

    const handleExtendDuration = async () => {
        try {
            const totalDuration = (durationDays * 24 * 60 * 60) + (durationHours * 60 * 60) + (durationMinutes * 60);
            const data = await extendDuration.writeContractAsync({
                address: config.contractAddress,
                abi: config.contractABI,
                functionName: "updatePollEndTime",
                args: [pollId, totalDuration]
            });
            setExtendDurationTxnHash(data);
        } catch (err) {
            console.log(err);
        }
    }

    const waitForExtendDurationTxn = useWaitForTransactionReceipt({
        hash: extendDurationTxnHash,
        query: { enabled: Boolean(extendDurationTxnHash) }
    });

    useEffect(() => {
        if (waitForExtendDurationTxn.isSuccess) {
            refetchPollIdDetails();
        }
    }, [waitForExtendDurationTxn.isSuccess, refetchPollIdDetails]);

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

    useEffect(() => {
        // Notify parent that this pollId is fully loaded/rendered
        if (pollIdDetails && onLoaded) {
            onLoaded(pollId);
        }
    }, [pollIdDetails, pollId, onLoaded]);

    const handleDeemPollIdVoid = async (_pollId) => {
        try {
            const data = await deemPollIdVoid.writeContractAsync({
                address: config.contractAddress,
                abi: config.contractABI,
                functionName: "deemPollVoid",
                args: [_pollId]
            });
            setDeemPollIdVoidTxnHash(data);
        } catch (err) {
            console.log(err);
        }
    }

    const waitForDeemPollIdVoidTxn = useWaitForTransactionReceipt({
        hash: deemPollIdVoidTxnHash,
        query: { enabled: Boolean(deemPollIdVoidTxnHash) }
    });

    useEffect(() => {
        if (waitForDeemPollIdVoidTxn.isSuccess) {
            refetchPollIdDetails();
        }
    }, [waitForDeemPollIdVoidTxn.isSuccess, refetchPollIdDetails]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(`http://localhost:5173/all-polls?pollId=${pollId}`);  // Copies current URL; replace with any link string.
            setButtonText("Link Copied");
            setTimeout(() => {
                setButtonText("Share");
            }, 1000);
        } catch (err) {
            console.error('Failed to copy: ', err);
        }
    };

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
            <div className="d-flex align-items-center justify-content-end w-100">
                <button className="btn p-0 rounded-5 share-button d-flex align-items-center justify-content-center p-2" style={{ width: "3%" }} onClick={() => setShowModal(true)}> <BsThreeDotsVertical /></button>
                <PollConfigModal show={showModal} onClose={() => setShowModal(false)}>
                    <h4 className="px-4 fw-bold">{pollId}. {pollIdDetails[4]}</h4>
                    <button className="btn mt-3 mb-1 px-3 rounded-5 custom-hover fw-bold" style={{ backgroundColor: "#9e42f5", color: "white" }} onClick={handleCopy} disabled={buttonText === "Link Copied"}>{buttonText}</button>
                    {(connectedAccount.address === pollIdDetails[0] || ownerAddress === connectedAccount.address) && (
                        <>
                            <div className="w-100 my-3" style={{ height: "1px", backgroundColor: "rgba(0, 0, 0, 0.1)" }}></div>
                            <div className="d-flex flex-column align-items-center justify-content-center gap-3 w-100 px-4">
                                <h4 className="fw-semibold">Poll Config</h4>
                                <button className="btn fw-bold rounded-5 px-3 w-100 custom-hover mb-2"
                                    style={{ backgroundColor: "#9e42f5", color: "white" }}
                                    disabled={deemPollIdVoid.isPending || waitForDeemPollIdVoidTxn.isLoading || pollIdDetails[3] || extendDuration.isPending || waitForExtendDurationTxn.isLoading}
                                    onClick={() => handleDeemPollIdVoid(pollId)}>
                                    {deemPollIdVoid.isPending || waitForDeemPollIdVoidTxn.isLoading ?
                                        (<div className="d-flex align-items-center justify-content-center gap-2">
                                            <span>Deem Poll Void</span>
                                            <div className="spinner-border spinner-border-sm text-light" role="status" />
                                        </div>) :
                                        "Deem Poll Void"
                                    }
                                </button>
                                <div className="accordion" id="pollDurationAccordion" style={{ width: "100%" }}>
                                    <div className="accordion-item border-0" style={{ width: "100%" }}>
                                        <h2 className="accordion-header bg-light" id="headingDuration" style={{ width: "100%" }}>
                                            <button
                                                className="btn fw-bold collapsed d-flex align-items-center justify-content-center rounded-5 custom-hover"
                                                type="button"
                                                data-bs-toggle="collapse"
                                                data-bs-target="#collapseDuration"
                                                aria-expanded="false"
                                                aria-controls="collapseDuration"
                                                style={{ width: "100%", backgroundColor: "#9e42f5", color: "white" }}
                                            >
                                                Extend Poll Duration
                                            </button>
                                        </h2>
                                        <div
                                            id="collapseDuration"
                                            className="accordion-collapse collapse"
                                            aria-labelledby="headingDuration"
                                            data-bs-parent="#pollDurationAccordion"
                                        >
                                            <div className="accordion-body bg-light">
                                                <div className="mb-3">
                                                    <label htmlFor="durationDays" className="form-label fw-semibold">
                                                        Days: {durationDays}
                                                    </label>
                                                    <input
                                                        type="range"
                                                        id="durationDays"
                                                        className="form-range"
                                                        min={minObj.days}
                                                        max={maxDurationDays}
                                                        step="1"
                                                        value={durationDays}
                                                        onChange={handleDurationDaysChange}
                                                        disabled={minObj.days === "0" || pollIdDetails[3] || extendDuration.isPending || waitForExtendDurationTxn.isLoading || deemPollIdVoid.isPending || waitForDeemPollIdVoidTxn.isLoading}
                                                    />
                                                </div>
                                                <div className="mb-3">
                                                    <label htmlFor="durationHours" className="form-label fw-semibold">
                                                        Hours: {durationHours}
                                                    </label>
                                                    <input
                                                        type="range"
                                                        id="durationHours"
                                                        className="form-range"
                                                        min={durationDays === minObj.days ? minObj.hours : 0}
                                                        max="23"
                                                        step="1"
                                                        value={durationHours}
                                                        onChange={handleDurationHoursChange}
                                                        disabled={(durationDays === maxDurationDays) || (minObj.hours === "0" || pollIdDetails[3]) || extendDuration.isPending || waitForExtendDurationTxn.isLoading || deemPollIdVoid.isPending || waitForDeemPollIdVoidTxn.isLoading}
                                                    />
                                                </div>
                                                <div>
                                                    <label htmlFor="durationMinutes" className="form-label fw-semibold">
                                                        Minutes: {durationMinutes}
                                                    </label>
                                                    <input
                                                        type="range"
                                                        id="durationMinutes"
                                                        className="form-range"
                                                        min={durationDays === minObj.days && durationHours === minObj.hours ? minObj.minutes : 0}
                                                        max="59"
                                                        step="1"
                                                        value={durationMinutes}
                                                        onChange={handleDurationMinutesChange}
                                                        disabled={(durationDays === maxDurationDays) || (minObj.minutes === "0" || pollIdDetails[3]) || extendDuration.isPending || waitForExtendDurationTxn.isLoading || deemPollIdVoid.isPending || waitForDeemPollIdVoidTxn.isLoading}
                                                    />
                                                </div>
                                                {minObj.days === "0" && minObj.hours === "0" && minObj.minutes === "0" && !pollIdDetails[3] ? (
                                                    <div className="alert alert-warning mt-3 mb-0 d-flex justify-content-center" role="alert">
                                                        Cannot extend duration as poll has ended.
                                                    </div>
                                                ) : pollIdDetails[3] ? (
                                                    <div className="alert alert-warning mt-3 mb-0 d-flex justify-content-center" role="alert">
                                                        Cannot extend duration as poll is deemed void.
                                                    </div>
                                                ) : <div className="d-flex justify-content-center mt-3 mb-0">
                                                    <button className="btn rounded-5 fw-bold custom-hover px-4"
                                                        style={{ backgroundColor: "#9e42f5", color: "white" }}
                                                        onClick={handleExtendDuration}
                                                        disabled={extendDuration.isPending || waitForExtendDurationTxn.isLoading || deemPollIdVoid.isPending || waitForDeemPollIdVoidTxn.isLoading || pollIdDetails[3]}>
                                                        {extendDuration.isPending || waitForExtendDurationTxn.isLoading ?
                                                            (<div className="d-flex align-items-center justify-content-center gap-2">
                                                                <span>Extending duration</span>
                                                                <div className="spinner-border spinner-border-sm text-light" role="status" />
                                                            </div>) :
                                                            "Extend"
                                                        }
                                                    </button>
                                                </div>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </PollConfigModal>
            </div>
            <h5 className="fw-bold mb-4">
                {pollId}. {pollIdDetails[4]}
            </h5>
            <div className="btn-group-vertical gap-2" style={{ width: "45%" }} role="group" aria-label="Vertical button group">
                {Array.from({ length: pollIdDetails[5].length }).map((_, index) => (
                    <button key={index}
                        className="btn w-100 fw-bold p-2 my-2 rounded-5 custom-hover"
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
                <div className="mt-3 fw-semibold">
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
