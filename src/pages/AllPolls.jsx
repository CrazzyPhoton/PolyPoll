import { useState, useRef, useEffect } from "react";
import { useReadContract } from "wagmi";
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
    const maxPageButtons = 5;

    const { data: _pollsCreated } = useReadContract({
        address: config.contractAddress,
        abi: config.contractABI,
        functionName: "pollsCreated",
        chainId: sepolia.id
    });

    // Query param management
    const [searchParams, setSearchParams] = useSearchParams();
    const searchedPollId = parseInt(searchParams.get("pollId"), 10);

    // --- New Ref to track if we just searched
    const justSearchedRef = useRef(false);

    useEffect(() => {
        if (!_pollsCreated || !searchedPollId || isNaN(searchedPollId)) return;
        const pollsCreated = parseInt(_pollsCreated.toString(), 10);
        if (searchedPollId < 1 || searchedPollId > pollsCreated) return;
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

    const pollsCreated = parseInt(_pollsCreated.toString(), 10);
    const totalPages = Math.ceil(pollsCreated / pollsPerPage);

    const startIndex = pollsCreated - (page - 1) * pollsPerPage;
    const endIndex = Math.max(startIndex - pollsPerPage + 1, 1);
    const pollIds = [];
    for (let pollId = startIndex; pollId >= endIndex; pollId--) {
        pollIds.push(pollId);
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
        justSearchedRef.current = false;  // <<< don't scroll to searchedPollId anymore
    };

    return (
        <div id="all-polls" className="container-fluid d-flex flex-column align-items-center justify-content-start bg-info-subtle py-5 px-0 h-auto">
            <div ref={paginationRef} className="w-75 bg-light text-center display-4 fw-bold mb-5 py-3 rounded-5 border border-2 border-black">
                All Polls
            </div>
            <div className="d-flex align-items-center justify-content-center rounded-5 border border-2 border-black bg-light gap-3 p-3 mb-5 w-75">
                <button
                    className="btn fw-bold rounded-5 p-3 custom-hover"
                    style={{ backgroundColor: "#9e42f5", color: "white" }}
                    onClick={() => handleSetPage(1)}
                    disabled={page === 1}
                >
                    {"First"}
                </button>
                <button className="btn fw-bold rounded-5 p-3 custom-hover" style={{ backgroundColor: "#9e42f5", color: "white" }} onClick={() => handleSetPage(page - 1)} disabled={page === 1}>
                    {"<<"}
                </button>
                {visiblePages.map((p) => (
                    <button key={p} className="btn fw-bold rounded-5 p-3 custom-hover" style={{ backgroundColor: "#9e42f5", color: "white", outline: page === p ? "5px solid black" : "none" }} onClick={() => handleSetPage(p)}>
                        {p}
                    </button>
                ))}
                <button className="btn fw-bold rounded-5 p-3 custom-hover" style={{ backgroundColor: "#9e42f5", color: "white" }} onClick={() => handleSetPage(page + 1)} disabled={page === totalPages}>
                    {">>"}
                </button>
                <button
                    className="btn fw-bold rounded-5 p-3 custom-hover"
                    style={{ backgroundColor: "#9e42f5", color: "white" }}
                    onClick={() => handleSetPage(totalPages)}
                    disabled={page === totalPages}
                >
                    {"Last"}
                </button>
            </div>
            <div className="list-group h-auto w-75 gap-5 mb-4">
                {pollIds.map((pollId) => (
                    <div
                        key={pollId}
                        className="d-flex align-items-center justify-content-center list-group-item h-auto pb-5 pt-3 border border-2 border-black rounded-5"
                        style={pollId === searchedPollId ? { boxShadow: "0 0 12px 3px #9e42f5" } : {}}
                    >
                        <PollDetailsByIdOnLoad pollId={pollId} onLoaded={pollId === searchedPollId ? (id) => setLoadedPollId(id) : undefined} />
                    </div>
                ))}
            </div>
            <div className="d-flex align-items-center justify-content-center rounded-5 border border-2 border-black bg-light gap-3 p-3 mt-4 w-75">
                <button
                    className="btn fw-bold rounded-5 p-3 custom-hover"
                    style={{ backgroundColor: "#9e42f5", color: "white" }}
                    onClick={() => handleSetPage(1)}
                    disabled={page === 1}
                >
                    {"First"}
                </button>
                <button className="btn fw-bold rounded-5 p-3 custom-hover" style={{ backgroundColor: "#9e42f5", color: "white" }} onClick={() => handleSetPage(page - 1)} disabled={page === 1}>
                    {"<<"}
                </button>
                {visiblePages.map((p) => (
                    <button key={p} className="btn fw-bold rounded-5 p-3 custom-hover" style={{ backgroundColor: "#9e42f5", color: "white", outline: page === p ? "5px solid black" : "none" }} onClick={() => handleSetPage(p)}>
                        {p}
                    </button>
                ))}
                <button className="btn fw-bold rounded-5 p-3 custom-hover" style={{ backgroundColor: "#9e42f5", color: "white" }} onClick={() => handleSetPage(page + 1)} disabled={page === totalPages}>
                    {">>"}
                </button>
                <button
                    className="btn fw-bold rounded-5 p-3 custom-hover"
                    style={{ backgroundColor: "#9e42f5", color: "white" }}
                    onClick={() => handleSetPage(totalPages)}
                    disabled={page === totalPages}
                >
                    {"Last"}
                </button>
            </div>
        </div>
    );
};
