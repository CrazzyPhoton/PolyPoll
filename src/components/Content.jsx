import { useState, useEffect, useRef } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { config } from "../utils/config";
import { sepolia } from "viem/chains";
import { PollDetailsById } from "../utils/PollDetailsById";
import { useNavigate } from 'react-router-dom';

export const Content = () => {

    // 1. CREATE POLL // 

    const account = useAccount();
    const maxDays = useReadContract({
        address: config.contractAddress,
        abi: config.contractABI,
        functionName: "maximumDuration",
        chainId: sepolia.id
    });
    const [question, setQuestion] = useState("");
    const [numChoices, setNumChoices] = useState(2);
    const [choices, setChoices] = useState(["", ""]);
    const [durationDays, setDurationDays] = useState(1);
    const [durationHours, setDurationHours] = useState(0);
    const [durationMinutes, setDurationMinutes] = useState(0);
    const sendCreatePollTx = useWriteContract();
    const [createPollTxHash, setCreatePollTxHash] = useState(null);
    const [allowModalReOpen, setAllowModalReopen] = useState(false);
    const [uniqueRandomIntegers, setUniqueRandomIntegers] = useState([]);
    let { data: currentPollsCreated, isSuccess: isSuccessCurrentPolls, refetch: refetchCurrentPolls } = useReadContract({
        address: config.contractAddress,
        abi: config.contractABI,
        functionName: "pollsCreated",
        chainId: sepolia.id
    })

    // Duration config //
    const maxDurationDays = maxDays.data ? (parseInt(maxDays.data.toString(), 10) / 86400) : 100;

    const handleDurationDaysChange = (e) => {
        setDurationDays(parseInt(e.target.value, 10));
        if (parseInt(e.target.value, 10) === maxDurationDays) {
            setDurationHours(0);
            setDurationMinutes(0);
        }
        if (parseInt(e.target.value, 10) === 0 && durationHours === 0) {
            setDurationMinutes(1);
        }
    };

    const handleDurationHoursChange = (e) => {
        setDurationHours(parseInt(e.target.value, 10));
        if (parseInt(e.target.value, 10) === 0 && durationDays === 0) {
            setDurationMinutes(1);
        }
    };

    const handleDurationMinutesChange = (e) => {
        setDurationMinutes(parseInt(e.target.value, 10));
    };


    // Choices config //
    const currentMaxChoices = useReadContract({
        address: config.contractAddress,
        abi: config.contractABI,
        functionName: "maximumChoices",
        chainId: sepolia.id
    });

    const maxChoices = currentMaxChoices.data ? parseInt(currentMaxChoices.data.toString(), 10) : 10;

    const handleNumChoicesChange = (e) => {
        const newCount = parseInt(e.target.value, 10);
        setNumChoices(newCount);
        setChoices((prev) => {
            const updated = [...prev];
            updated.length = newCount;
            return updated.fill("", prev.length, newCount);
        });
    };

    const handleChoiceChange = (index, value) => {
        const updated = [...choices];
        updated[index] = value;
        setChoices(updated);
    };

    // Form submit //
    const handleSubmit = async (e) => {
        try {
            e.preventDefault();
            const totalDuration = (durationDays * 24 * 60 * 60) + (durationHours * 60 * 60) + (durationMinutes * 60);
            const data = await sendCreatePollTx.writeContractAsync({
                address: config.contractAddress,
                abi: config.contractABI,
                functionName: "createPoll",
                args: [question, choices, totalDuration],
            });
            setCreatePollTxHash(data);
            setAllowModalReopen(true);
            setUniqueRandomIntegers([]);
            isSuccessCurrentPolls = false;
            currentPollsCreated = null;
            refetchCurrentPolls();

        } catch (err) {
            console.log(err);
        }
    };

    // 2. MODAL LOAD //

    let waitForCreatePollTx = useWaitForTransactionReceipt({
        hash: createPollTxHash,
        query: { enabled: Boolean(createPollTxHash) }
    })

    let { data: pollsCreated } = useReadContract({
        address: config.contractAddress,
        abi: config.contractABI,
        functionName: "pollsCreated",
        query: { enabled: Boolean(waitForCreatePollTx.isSuccess) }
    })
    let { data: pollDetails, isSuccess: isPollSuccess, refetch: refetchPollDetails } = useReadContract({
        address: config.contractAddress,
        abi: config.contractABI,
        functionName: "getPollDetails",
        args: pollsCreated ? [parseInt(pollsCreated.toString(), 10)] : undefined,
        query: { enabled: Boolean(pollsCreated) }
    });

    const [timeLeft, setTimeLeft] = useState(["--", "--", "--", "--"]);
    const [isTimeLeft, setIsTimeLeft] = useState(false);
    const modalRef = useRef(null);
    const modalInstance = useRef(null);
    const navigate = useNavigate();
    const [clicked, setClicked] = useState(null);
    const sendVoteOnModalTx = useWriteContract();
    let [voteTxHash, setVoteTxHash] = useState(null);

    useEffect(() => {
        if (modalRef.current && !modalInstance.current) {
            modalInstance.current = new window.bootstrap.Modal(modalRef.current);
        }
    }, [modalRef]);

    useEffect(() => {
        if (!isPollSuccess) {
            return;
        }

        setTimeLeft(0);

        const interval = setInterval(() => {
            const now = Date.now();
            const endTime = Number(pollDetails[2]) * 1000;
            const diff = endTime - now;

            if (diff <= 0) {
                clearInterval(interval);
                setTimeLeft(["0", "00", "00", "00"]);
                return;
            }

            let totalSeconds = Math.floor(diff / 1000);
            let days = String(Math.floor(totalSeconds / (3600 * 24)))
            totalSeconds %= (3600 * 24);
            let hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
            totalSeconds %= 3600;
            let minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
            let seconds = String(totalSeconds % 60).padStart(2, '0');

            setTimeLeft([days, hours, minutes, seconds]);
        }, 1000);
        setIsTimeLeft(true);

        return () => clearInterval(interval);
    }, [isPollSuccess, pollDetails]);

    useEffect(() => {
        if (
            isTimeLeft && allowModalReOpen && isPollSuccess &&
            pollDetails && pollsCreated && waitForCreatePollTx.isSuccess
        ) {
            modalInstance.current?.show();
        } else if (
            modalInstance.current &&
            (
                !isTimeLeft || !allowModalReOpen || !isPollSuccess ||
                !pollDetails || !pollsCreated || !waitForCreatePollTx.isSuccess
            )
        ) {
            modalInstance.current.hide();
        }
    }, [isTimeLeft, allowModalReOpen, isPollSuccess, pollDetails, pollsCreated, waitForCreatePollTx.isSuccess]);


    const handleVoteOnModal = async (pollId, choice) => {
        try {
            let updated = Array(Math.max(2, numChoices)).fill(false);
            updated[choice] = true;
            setClicked(updated);
            const data = await sendVoteOnModalTx.writeContractAsync({
                address: config.contractAddress,
                abi: config.contractABI,
                functionName: "vote",
                args: [pollId, choice]
            })
            setVoteTxHash(data);
            setUniqueRandomIntegers([]);

        } catch (err) {
            console.log(err);
        }
    }

    let waitForVoteTx = useWaitForTransactionReceipt({
        hash: voteTxHash,
        query: { enabled: Boolean(voteTxHash) } // only run if txHash is set
    })

    useEffect(() => {
        if (waitForVoteTx.isSuccess) {
            refetchPollDetails();
        }
    }, [waitForVoteTx.isSuccess, refetchPollDetails]);

    const handleModalClose = () => {
        modalInstance.current?.hide();
        setIsTimeLeft(false);
        setAllowModalReopen(false);
        setQuestion("");
        setNumChoices(2);
        setChoices(["", ""]);
        setDurationDays(1);
        setDurationHours(0);
        setDurationMinutes(0);
        setCreatePollTxHash(null);
        isPollSuccess = false;
        pollDetails = null;
        pollsCreated = null;
        waitForCreatePollTx.isSuccess = false;
        setVoteTxHash(null);
        waitForVoteTx.isSuccess = false;
    }

    // CAST VOTE //

    const generateUniqueRandomIntegers = (count, max) => {
        if (max < count) {
            throw new Error("max must be at least as large as count");
        }

        // Create an array of all possible integers
        const allNumbers = Array.from({ length: max }, (_, i) => i + 1);

        // Fisher-Yates shuffle the array
        for (let i = allNumbers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allNumbers[i], allNumbers[j]] = [allNumbers[j], allNumbers[i]];
        }

        // Take the first 'count' elements
        return allNumbers.slice(0, count);
    }

    useEffect(() => {
        if (isSuccessCurrentPolls) {
            let _count = Math.min(parseInt(currentPollsCreated.toString(), 10), 50);
            const _uniqueRandomIntegers = generateUniqueRandomIntegers(_count, parseInt(currentPollsCreated.toString(), 10));
            setUniqueRandomIntegers(_uniqueRandomIntegers);
        }
    }, [isSuccessCurrentPolls, currentPollsCreated]);

    useEffect(() => {
        if (waitForVoteTx.isSuccess) {
            let _count = Math.min(parseInt(currentPollsCreated.toString(), 10), 50);
            const _uniqueRandomIntegers = generateUniqueRandomIntegers(_count, parseInt(currentPollsCreated.toString(), 10));
            setUniqueRandomIntegers(_uniqueRandomIntegers);
        }
    }, [waitForVoteTx.isSuccess, currentPollsCreated]);

    return (
        <div className="container-fluid d-flex flex-column align-items-center gap-5 vh-150 bg-info-subtle">
            <h1 className="text-center fw-bolder display-2 mt-5 mb-4">Polls with the security of blockchain.</h1>
            <div className="container-fluid d-flex flex-lg-row align-items-lg-start justify-content-lg-between mb-5 mx-5 flex-column align-items-center">
                <div className="container-fluid d-flex flex-column align-items-center justify-content-center pt-4 pb-4 bg-light rounded-5 border border-2 border-black shadow-lg mb-lg-0 mb-5 mx-5">
                    <h4 className="d-flex align-items-center fw-semibold display-6 p-0 mb-3">Start a poll</h4>
                    <p className="text-center text-wrap text-body-secondary m-0 py-0 px-5 fs-5">
                        Create polls as per your convenience,
                        make polls as short as 1 min and as long
                        as {maxDurationDays} days with up to {maxChoices} choices!
                    </p>
                    <a href="#create-poll" className="mt-4 mb-3">
                        <button className="btn rounded-5 fw-semibold py-3 fs-5 custom-hover"
                            style={{ backgroundColor: "#9e42f5", color: "white", width: "150px" }}>
                            Create Poll
                        </button>
                    </a>
                </div>
                <div className="container-fluid d-flex flex-column align-items-center justify-content-center pt-4 pb-4 bg-light rounded-5 border border-2 border-black shadow-lg mt-lg-0 mt-5 mx-5">
                    <h4 className="fw-semibold display-6 p-0 mb-3">Vote for a poll</h4>
                    <p className="text-center text-wrap text-body-secondary m-0 py-0 px-5 fs-5">
                        Cast your vote for polls created by users.
                        Browse active polls, review choices,
                        and make your voice count.
                    </p>
                    <a href="#start-voting" className="mt-4 mb-3">
                        <button className="btn rounded-5 fw-semibold py-3 fs-5 custom-hover"
                            style={{ backgroundColor: "#9e42f5", color: "white", width: "150px" }}>
                            Start voting
                        </button>
                    </a>
                </div>
            </div>
            <div id="create-poll" className="container-fluid d-flex flex-column align-items-center justify-content-start mb-5 py-4 bg-light rounded-5 border border-2 border-black shadow-lg" style={{ height: "auto", width: "89vw", scrollMarginTop: "115px" }}>
                <h1 className="fw-medium fs-1 text-center mb-3 mt-1">Create Poll</h1>
                <form onSubmit={handleSubmit} style={{ width: "85%" }}>
                    <div className="mb-3">
                        <label htmlFor="question" className="form-label fw-semibold">Poll Question</label>
                        <input
                            type="text"
                            className="form-control rounded-5 border-2 border-black"
                            id="question"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="Enter your poll question"
                            disabled={sendCreatePollTx.isPending || waitForCreatePollTx.isLoading}
                            required
                        />
                    </div>
                    <div className="accordion mb-3" id="pollDurationAccordion">
                        <div className="accordion-item border-0">
                            <h2 className="accordion-header" id="headingDuration">
                                <button
                                    className="accordion-button fw-semibold collapsed ps-0 py-2 bg-light shadow-none"
                                    type="button"
                                    data-bs-toggle="collapse"
                                    data-bs-target="#collapseDuration"
                                    aria-expanded="false"
                                    aria-controls="collapseDuration"
                                >
                                    Poll Duration
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
                                            min="0"
                                            max={maxDurationDays}
                                            step="1"
                                            value={durationDays}
                                            onChange={handleDurationDaysChange}
                                            disabled={sendCreatePollTx.isPending || waitForCreatePollTx.isLoading}
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
                                            min="0"
                                            max="23"
                                            step="1"
                                            value={durationHours}
                                            onChange={handleDurationHoursChange}
                                            disabled={(durationDays === maxDurationDays) || sendCreatePollTx.isPending || waitForCreatePollTx.isLoading}
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
                                            min={(durationDays === 0 && durationHours === 0) ? "1" : "0"}
                                            max="59"
                                            step="1"
                                            value={durationMinutes}
                                            onChange={handleDurationMinutesChange}
                                            disabled={(durationDays === maxDurationDays) || sendCreatePollTx.isPending || waitForCreatePollTx.isLoading}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mb-3">
                        <label htmlFor="choiceCount" className="form-label fw-semibold">
                            Number of Choices: {numChoices}
                        </label>
                        <input
                            type="range"
                            id="choiceCount"
                            className="form-range"
                            min="2"
                            max={maxChoices}
                            step="1"
                            value={numChoices}
                            onChange={handleNumChoicesChange}
                            disabled={sendCreatePollTx.isPending || waitForCreatePollTx.isLoading}
                        />
                    </div>
                    {Array.from({ length: Math.max(2, numChoices) }).map((_, index) => (
                        <div className="mb-3" key={index}>
                            <label htmlFor={`choice${index + 1}`} className="form-label fw-semibold">Choice {index + 1}</label>
                            <input
                                type="text"
                                className="form-control rounded-5 border-2 border-black"
                                id={`choice${index + 1}`}
                                value={choices[index] || ""}
                                onChange={(e) => handleChoiceChange(index, e.target.value)}
                                placeholder={`Enter choice ${index + 1}`}
                                disabled={sendCreatePollTx.isPending || waitForCreatePollTx.isLoading}
                                required
                            />
                        </div>
                    ))}
                    <button type="submit"
                        className="btn rounded-5 w-100 fw-semibold py-2 mb-3 mt-1 custom-hover"
                        style={{ backgroundColor: "#9e42f5", color: "white" }}
                        disabled={account.isDisconnected || account.isConnecting || sendCreatePollTx.isPending || waitForCreatePollTx.isLoading}>
                        {account.isDisconnected ? (
                            "Connect Wallet To Create"
                        ) : account.isConnecting ? (
                            <div className="d-flex align-items-center justify-content-center gap-2">
                                <span>Connecting</span>
                                <div className="spinner-border spinner-border-sm text-light" role="status" />
                            </div>
                        ) : (sendCreatePollTx.isPending || waitForCreatePollTx.isLoading) ? (
                            <div className="d-flex align-items-center justify-content-center gap-2">
                                <span>Creating Poll</span>
                                <div className="spinner-border spinner-border-sm text-light" role="status" />
                            </div>
                        ) : "Create"
                        }
                    </button>
                </form>
                <div
                    className="modal fade"
                    id="pollSuccessModal"
                    tabIndex="-1"
                    aria-labelledby="pollSuccessModalLabel"
                    aria-hidden="true"
                    ref={modalRef}
                    data-bs-backdrop="static"
                    data-bs-keyboard="false"
                >
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header bg-light">
                                <h4 className="modal-title fw-bold" id="pollSuccessModalLabel">Poll Created</h4>
                                <button onClick={handleModalClose} type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" disabled={sendVoteOnModalTx.isPending || waitForVoteTx.isLoading}></button>
                            </div>
                            <div className="modal-body d-flex flex-column align-items-center bg-light">
                                <h5 className="text-center fw-bold mb-3 mt-2">{pollsCreated}. {question}</h5>
                                <div className="btn-group-vertical mb-3 gap-2 w-75 align-items-center justify-content-center" role="group" aria-label="Vertical button group">
                                    {Array.from({ length: Math.max(2, numChoices) }).map((_, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            className="btn w-100 fw-bold p-2 my-2 rounded-5 custom-hover "
                                            style={{ backgroundColor: "#9e42f5", color: "white" }}
                                            onClick={() => handleVoteOnModal(pollsCreated, index)}
                                            disabled={sendVoteOnModalTx.isPending || waitForVoteTx.isLoading || waitForVoteTx.isSuccess}>
                                            {(sendVoteOnModalTx.isPending && clicked[index]) || (waitForVoteTx.isLoading && clicked[index]) ?
                                                (<div className="d-flex align-items-center justify-content-center gap-2">
                                                    <span>{choices[index]}</span>
                                                    <div className="spinner-border spinner-border-sm text-light" role="status" />
                                                </div>
                                                ) :
                                                waitForVoteTx.isSuccess ? (
                                                    <div>{choices[index]} : {parseInt((pollDetails[6][index]).toString(), 10) && parseInt((pollDetails[7]).toString(), 10) ? ((parseInt((pollDetails[6][index]).toString(), 10) * 100) / parseInt((pollDetails[7]).toString(), 10)) : 0}% votes
                                                        {clicked[index] ? " (Your vote)" : ""}
                                                    </div>
                                                ) :
                                                    choices[index]}
                                        </button>
                                    ))}
                                </div>
                                <div className="d-flex align-items-center justify-content-center gap-2">
                                    {timeLeft ?
                                        (<h6 className="fw-bold mt-3">Time left: {timeLeft.join(":")}</h6>) : (
                                            <>
                                                <span className="fw-bold fs-6 mt-3">Time left:</span>
                                                <div className="spinner-border spinner-border-sm text-black mt-3" role="status" />
                                            </>
                                        )}
                                </div>
                            </div>
                            <div className="modal-footer bg-light d-flex align-items-center justify-content-evenly">
                                <button onClick={handleModalClose} type="button" className="btn fw-bold custom-hover rounded-5 w-25" data-bs-dismiss="modal" style={{ backgroundColor: "#9e42f5", color: "white" }} disabled={sendVoteOnModalTx.isPending || waitForVoteTx.isLoading}>Close</button>
                                <button onClick={() => {navigate(`/all-polls?pollId=${pollsCreated}`); handleModalClose();}} type="button" className="btn fw-bold custom-hover rounded-5 w-auto px-4" style={{ backgroundColor: "#9e42f5", color: "white" }} disabled={sendVoteOnModalTx.isPending || waitForVoteTx.isLoading}>
                                    View On All Polls
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="container-fluid d-flex align-items-center justify-content-center mb-5" style={{height: "130vh"}}>
                <div id="start-voting" className="carousel slide container-fluid d-flex flex-column align-items-center justify-content-start pt-4 bg-light rounded-5 border border-2 border-black shadow-lg"
                    data-bs-theme="dark"
                    data-bs-ride="carousel"
                    style={{ height: "100%", width: "89vw", scrollMarginTop: "115px" }}>
                    <h1 className="fw-semibold text-center mt-1 mb-5">Cast Vote</h1>
                    <div className="carousel-inner" style={{ height: "100%", width: "100%" }}>
                        {uniqueRandomIntegers.length === 0 ? (
                            <div className="carousel-item active">
                                <div className="d-flex align-items-center justify-content-center gap-2">
                                    <span className="text-center fw-bold fs-5 mb-3 mt-4">Refreshing Polls</span>
                                    <div className="spinner-border spinner-border-sm text-black mb-3 mt-4" role="status" />
                                </div>
                            </div>
                        ) : (
                            uniqueRandomIntegers.map((pollId, index) => (
                                <div
                                    key={pollId}
                                    className={`carousel-item ${index === 0 ? "active" : ""}`}
                                >
                                    <PollDetailsById pollId={pollId} />
                                </div>
                            ))
                        )}
                    </div>
                    <button className="carousel-control-prev shadow-lg rounded-start-5 bg-light" type="button" data-bs-target="#start-voting" data-bs-slide="prev">
                        <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                        <span className="visually-hidden">Previous</span>
                    </button>
                    <button className="carousel-control-next shadow-lg rounded-end-5 bg-light" type="button" data-bs-target="#start-voting" data-bs-slide="next">
                        <span className="carousel-control-next-icon" aria-hidden="true"></span>
                        <span className="visually-hidden">Next</span>
                    </button>
                </div>
            </div>
        </div >
    );
};
