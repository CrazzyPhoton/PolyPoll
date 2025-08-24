import { useState, useRef, useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import { config } from "../utils/config";
import { sepolia } from "viem/chains";
import { PollDetailsByIdOnLoad } from "../utils/PollDetailsByIdOnLoad";
import { useSearchParams } from "react-router-dom";

export const AllPolls = () => {
    const [page, setPage] = useState(1);
    const paginationRef = useRef(null);
    const shouldScrollRef = useRef(false);

    const [loadedPollId, setLoadedPollId] = useState(null);

    const pollsPerPage = 10;
    const maxPageButtons = 4;
    const account = useAccount();

    const { data: _pollsCreated } = useReadContract({
        address: config.contractAddress,
        abi: config.contractABI,
        functionName: "pollsCreated",
        chainId: sepolia.id
    });

    const { data: _votedPolls } = useReadContract({
        address: config.contractAddress,
        abi: config.contractABI,
        functionName: "pollsVotedByAddress",
        args: [account.address? account.address : "0x0000000000000000000000000000000000000000"],
        chainId: sepolia.id
    })

    const { data: _notVotedPolls } = useReadContract({
        address: config.contractAddress,
        abi: config.contractABI,
        functionName: "pollsNotVotedByAddress",
        args: [account.address? account.address : "0x0000000000000000000000000000000000000000"],
        chainId: sepolia.id
    })

    // Query param management
    const [searchParams, setSearchParams] = useSearchParams();
    const searchedPollId = parseInt(searchParams.get("pollId"), 10);

    // --- New Ref to track if we just searched
    const justSearchedRef = useRef(false);
    // Track if we're in search mode (to override filters) vs normal mode
    const [isInSearchMode, setIsInSearchMode] = useState(false);

    const [isVotedPollsActive, setIsVotedPollsActive] = useState(false);
    const [isNotVotedPollsActive, setIsNotVotedPollsActive] = useState(false);

    useEffect(() => {
        if (!_pollsCreated || !searchedPollId || isNaN(searchedPollId)) {
            setIsInSearchMode(false);
            return;
        }
        const pollsCreated = parseInt(_pollsCreated.toString(), 10);
        if (searchedPollId < 1 || searchedPollId > pollsCreated) {
            setIsInSearchMode(false);
            return;
        }

        // Enter search mode and clear filters when searching for a specific poll
        setIsInSearchMode(true);
        setIsVotedPollsActive(false);
        setIsNotVotedPollsActive(false);

        const pollPos = pollsCreated - searchedPollId + 1;
        const pageForSearch = Math.ceil(pollPos / pollsPerPage);

        if (page !== pageForSearch) {
            // If page actually changes, update it and mark scrolling should happen
            setPage(pageForSearch);
            shouldScrollRef.current = true;
            justSearchedRef.current = true;
        } else if (searchedPollId) {
            // If page is already set, force the scroll anyway
            shouldScrollRef.current = true;
            justSearchedRef.current = true;
        }
        // If pollId is not in URL, do nothing special!
    }, [_pollsCreated, searchedPollId, page]);

    // Clear search mode when no searchedPollId
    useEffect(() => {
        if (!searchedPollId || isNaN(searchedPollId)) {
            setIsInSearchMode(false);
        }
    }, [searchedPollId]);

    useEffect(() => {
        if (
            loadedPollId === searchedPollId &&
            shouldScrollRef.current &&
            justSearchedRef.current
        ) {
            const el = document.getElementById(loadedPollId);
            if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
            }
            shouldScrollRef.current = false;
            justSearchedRef.current = false;
            setLoadedPollId(null);
        }
    }, [loadedPollId, searchedPollId]);

    useEffect(() => {
        if (shouldScrollRef.current && !justSearchedRef.current) {
            if (paginationRef.current) {
                paginationRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
            }
            shouldScrollRef.current = false;
        }
    }, [page]);

    // Reset filters when account is disconnected
    useEffect(() => {
        if (!account.isConnected) {
            setIsVotedPollsActive(false);
            setIsNotVotedPollsActive(false);
            setPage(1); // Reset to first page
        }
    }, [account.isConnected]);

    const handleVotedPollsClick = () => {
        // Exit search mode and clear search params when filter is clicked
        setIsInSearchMode(false);
        if (searchedPollId) {
            searchParams.delete("pollId");
            setSearchParams(searchParams);
        }
        
        if (!isVotedPollsActive) {
            setIsNotVotedPollsActive(false);
            setPage(1); // Reset to first page when switching filters
        }
        setIsVotedPollsActive(!isVotedPollsActive);
    };

    const handleNotVotedPollsClick = () => {
        // Exit search mode and clear search params when filter is clicked
        setIsInSearchMode(false);
        if (searchedPollId) {
            searchParams.delete("pollId");
            setSearchParams(searchParams);
        }
        
        if (!isNotVotedPollsActive) {
            setIsVotedPollsActive(false);
            setPage(1); // Reset to first page when switching filters
        }
        setIsNotVotedPollsActive(!isNotVotedPollsActive);
    };

    // LOADING UI
    if (!_pollsCreated) {
        return (
            <div className="container-fluid d-flex flex-column align-items-center justify-content-center bg-info-subtle py-5 px-0 vh-100">
                <div className="w-75 bg-light h-auto rounded-5 border border-2 border-black d-flex align-items-center justify-content-center gap-3 py-2">
                    <span className="fs-2 fw-bold">Loading Polls</span>
                    <div className="spinner-border spinner-border-md text-dark" role="status" />
                </div>
            </div>
        );
    }

    // Determine which polls to show based on active filters
    let currentPolls = [];
    let totalPolls = 0;

    // Only override filters if we're in search mode AND actively searching
    const shouldShowAllPollsForSearch = isInSearchMode && searchedPollId && !isNaN(searchedPollId);

    if (!shouldShowAllPollsForSearch && isVotedPollsActive && _votedPolls) {
        // Convert to array and ensure they're numbers, then sort in descending order
        const votedPollsArray = Array.isArray(_votedPolls) ? _votedPolls : [_votedPolls];
        currentPolls = votedPollsArray
            .map(id => typeof id === 'string' ? parseInt(id, 10) : Number(id))
            .filter(id => !isNaN(id))
            .sort((a, b) => b - a); // Descending order
        totalPolls = currentPolls.length;
    } else if (!shouldShowAllPollsForSearch && isNotVotedPollsActive && _notVotedPolls) {
        // Convert to array and ensure they're numbers, then sort in descending order
        const notVotedPollsArray = Array.isArray(_notVotedPolls) ? _notVotedPolls : [_notVotedPolls];
        currentPolls = notVotedPollsArray
            .map(id => typeof id === 'string' ? parseInt(id, 10) : Number(id))
            .filter(id => !isNaN(id))
            .sort((a, b) => b - a); // Descending order
        totalPolls = currentPolls.length;
    } else {
        // Show all polls (default behavior or when searching) - already in descending order
        const pollsCreated = parseInt(_pollsCreated.toString(), 10);
        totalPolls = pollsCreated;
        
        const startIndex = pollsCreated - (page - 1) * pollsPerPage;
        const endIndex = Math.max(startIndex - pollsPerPage + 1, 1);
        
        for (let pollId = startIndex; pollId >= endIndex; pollId--) {
            currentPolls.push(pollId);
        }
    }

    const totalPages = Math.ceil(totalPolls / pollsPerPage);

    // Calculate poll IDs for current page when using filtered data
    let pollIds = [];
    if (!shouldShowAllPollsForSearch && (isVotedPollsActive || isNotVotedPollsActive)) {
        const startIdx = (page - 1) * pollsPerPage;
        const endIdx = Math.min(startIdx + pollsPerPage, totalPolls);
        pollIds = currentPolls.slice(startIdx, endIdx);
    } else {
        pollIds = currentPolls;
    }

    let startPage = Math.max(1, Math.min(page - Math.floor(maxPageButtons / 2), totalPages - maxPageButtons + 1));
    let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);

    if (endPage - startPage + 1 < maxPageButtons) {
        startPage = Math.max(1, endPage - maxPageButtons + 1);
    }
    const visiblePages = [];
    for (let i = startPage; i <= endPage; i++) visiblePages.push(i);

    // On manual pagination, clear pollId from the URL and don't allow special scroll
    const handleSetPage = (newPage) => {
        shouldScrollRef.current = true;
        setPage(newPage);
        // Remove pollId from the search params in the URL
        searchParams.delete("pollId");
        setSearchParams(searchParams);
        setIsInSearchMode(false); // Exit search mode
        justSearchedRef.current = false;  // <<< don't scroll to searchedPollId anymore
    };

    // Determine which poll should be highlighted (only when we have a valid searchedPollId in URL)
    const highlightedPollId = (searchedPollId && !isNaN(searchedPollId)) ? searchedPollId : null;

    return (
        <div id="all-polls" className="container-fluid d-flex flex-column align-items-center justify-content-start bg-info-subtle py-5 px-0 min-vh-100">
            <div ref={paginationRef} className="d-flex flex-column gap-4 align-items-center justify-content-center w-75 bg-light text-center display-4 fw-bold mb-5 py-3 rounded-5 border border-2 border-black">
                All Polls
                {account.isConnected &&
                    <div className="btn-group d-flex flex-lg-row flex-column w-75 mt-3 mb-3 gap-4">
                        <button
                            id="votedPolls"
                            className="btn rounded-5 fw-bold"
                            type="button"
                            style={{
                                width: "100%",
                                backgroundColor: isVotedPollsActive ? "#9e42f5" : "transparent",
                                color: isVotedPollsActive ? "white" : "black",
                                border: isVotedPollsActive ? "2px solid #9e42f5" : "2px solid black",
                            }}
                            onClick={handleVotedPollsClick}
                        >
                            Voted Polls {_votedPolls && `(${Array.isArray(_votedPolls) ? _votedPolls.length : 1})`}
                        </button>
                        <button
                            id="notVotedPolls"
                            className="btn rounded-5 fw-bold"
                            type="button"
                            style={{
                                width: "100%",
                                backgroundColor: isNotVotedPollsActive ? "#9e42f5" : "transparent",
                                color: isNotVotedPollsActive ? "white" : "black",
                                border: isNotVotedPollsActive ? "2px solid #9e42f5" : "2px solid black",
                            }}
                            onClick={handleNotVotedPollsClick}
                        >
                            Not Voted Polls {_notVotedPolls && `(${Array.isArray(_notVotedPolls) ? _notVotedPolls.length : 1})`}
                        </button>
                    </div>
                }
            </div>

            {/* Show message when no polls match the filter - but not when searching */}
            {!shouldShowAllPollsForSearch && (isVotedPollsActive || isNotVotedPollsActive) && pollIds.length === 0 && (
                <div className="w-75 bg-light h-auto rounded-5 border border-2 border-black d-flex align-items-center justify-content-center py-5 mb-5">
                    <span className="fs-4 fw-bold text-muted">
                        No {isVotedPollsActive ? 'voted' : 'not voted'} polls found
                    </span>
                </div>
            )}

            {/* Pagination controls - shown when totalPages > 1 (i.e., more than 10 polls) */}
            {totalPages > 1 && (
                <div className="d-flex rounded-5 border border-2 border-black bg-light p-3 mb-5">
                    <div className="btn-group">
                        <button
                            className="btn fw-bold rounded-5 custom-hover d-flex align-items-center mx-1 p-sm-3 p-2"
                            type="button"
                            style={{ backgroundColor: "#9e42f5", color: "white", border: "0" }}
                            onClick={() => handleSetPage(1)}
                            disabled={page === 1}
                        >
                            {"First"}
                        </button>
                        <button type="button" className="btn fw-bold custom-hover d-flex align-items-center rounded-5 mx-1 p-sm-3 p-2" style={{ backgroundColor: "#9e42f5", color: "white", border: "0" }} onClick={() => handleSetPage(page - 1)} disabled={page === 1}>
                            {"<<"}
                        </button>
                        {visiblePages.map((p) => (
                            <button key={p} type="button" className="btn fw-bold d-flex align-items-center rounded-5 mx-1 p-sm-3 p-2 custom-hover" style={{ backgroundColor: "#9e42f5", color: "white", border: "0", outline: page == p ? "4px solid black" : "none" }} onClick={() => handleSetPage(p)}>
                                {p}
                            </button>
                        ))}
                        <button type="button" className="btn fw-bold custom-hover d-flex align-items-center rounded-5 mx-1 p-sm-3 p-2" style={{ backgroundColor: "#9e42f5", color: "white", border: "0" }} onClick={() => handleSetPage(page + 1)} disabled={page === totalPages}>
                            {">>"}
                        </button>
                        <button
                            className="btn fw-bold rounded-end-5 custom-hover d-flex align-items-center rounded-5 mx-1 p-sm-3 p-2"
                            type="button"
                            style={{ backgroundColor: "#9e42f5", color: "white", border: "0" }}
                            onClick={() => handleSetPage(totalPages)}
                            disabled={page === totalPages}
                        >
                            {"Last"}
                        </button>
                    </div>
                </div>
            )}

            <div className="list-group h-auto w-75 gap-5 mb-4">
                {pollIds.map((pollId) => (
                    <div
                        key={pollId}
                        className="d-flex align-items-center justify-content-center list-group-item h-auto pb-5 pt-3 border border-2 border-black rounded-5"
                        style={pollId === highlightedPollId ? { boxShadow: "0 0 12px 3px #9e42f5" } : {}}
                    >
                        <PollDetailsByIdOnLoad pollId={pollId} onLoaded={pollId === highlightedPollId ? (id) => setLoadedPollId(id) : undefined} />
                    </div>
                ))}
            </div>

            {/* Bottom pagination controls - shown when totalPages > 1 */}
            {totalPages > 1 && (
                <div className="d-flex rounded-5 border border-2 border-black bg-light p-3 mt-4">
                    <div className="btn-group">
                        <button
                            className="btn fw-bold rounded-5 custom-hover d-flex align-items-center mx-1 p-sm-3 p-2"
                            type="button"
                            style={{ backgroundColor: "#9e42f5", color: "white", border: "0" }}
                            onClick={() => handleSetPage(1)}
                            disabled={page === 1}
                        >
                            {"First"}
                        </button>
                        <button type="button" className="btn fw-bold custom-hover d-flex align-items-center rounded-5 mx-1 p-sm-3 p-2" style={{ backgroundColor: "#9e42f5", color: "white", border: "0" }} onClick={() => handleSetPage(page - 1)} disabled={page === 1}>
                            {"<<"}
                        </button>
                        {visiblePages.map((p) => (
                            <button key={p} type="button" className="btn fw-bold d-flex align-items-center rounded-5 mx-1 p-sm-3 p-2 custom-hover" style={{ backgroundColor: "#9e42f5", color: "white", border: "0", outline: page == p ? "4px solid black" : "none" }} onClick={() => handleSetPage(p)}>
                                {p}
                            </button>
                        ))}
                        <button type="button" className="btn fw-bold custom-hover d-flex align-items-center rounded-5 mx-1 p-sm-3 p-2" style={{ backgroundColor: "#9e42f5", color: "white", border: "0" }} onClick={() => handleSetPage(page + 1)} disabled={page === totalPages}>
                            {">>"}
                        </button>
                        <button
                            className="btn fw-bold rounded-end-5 custom-hover d-flex align-items-center rounded-5 mx-1 p-sm-3 p-2"
                            type="button"
                            style={{ backgroundColor: "#9e42f5", color: "white", border: "0" }}
                            onClick={() => handleSetPage(totalPages)}
                            disabled={page === totalPages}
                        >
                            {"Last"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
