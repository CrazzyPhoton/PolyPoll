import { useState, useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import { config } from "../utils/config";
import { sepolia } from "viem/chains";
import { PollDetailsByIdOnLoad } from "../utils/PollDetailsByIdOnLoad";

export function MyPolls() {
    const [page, setPage] = useState(1);
    const account = useAccount();

    const { data: createdPolls } = useReadContract({
        address: config.contractAddress,
        abi: config.contractABI,
        functionName: "pollsCreatedByAddress",
        args: [account.isConnected ? account.address : "0x0000000000000000000000000000000000000000"],
        chainId: sepolia.id
    })

    // Scroll to top when page changes
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [page]);

    const pollsPerPage = 10;
    const maxPageButtons = 4;
    
    // Ensure createdPolls is an array before proceeding
    const pollsArray = createdPolls && Array.isArray(createdPolls) ? createdPolls : [];
    const numPollsCreated = pollsArray.length;
    const totalPages = Math.ceil(numPollsCreated / pollsPerPage);

    // Create a reversed array to show newest polls first, then paginate
    const reversedPolls = [...pollsArray].reverse();
    
    // Calculate the slice indices for current page
    const startIndex = (page - 1) * pollsPerPage;
    const endIndex = startIndex + pollsPerPage;
    
    // Get the polls for current page
    const pollIds = reversedPolls.slice(startIndex, endIndex);

    // Pagination button logic
    let startPage = Math.max(1, Math.min(page - Math.floor(maxPageButtons / 2), totalPages - maxPageButtons + 1));
    let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);

    if (endPage - startPage + 1 < maxPageButtons) {
        startPage = Math.max(1, endPage - maxPageButtons + 1);
    }
    
    const visiblePages = [];
    for (let i = startPage; i <= endPage; i++) visiblePages.push(i);

    const handleSetPage = (newPage) => {
        setPage(newPage);
    };

    return (
        <div id="my-polls" className="container-fluid min-vh-100 bg-info-subtle d-flex flex-column align-items-center justify-content-start py-5 px-0">
            <div className="d-flex flex-column align-items-center justify-content-center w-75 bg-light display-4 fw-bold mb-5 py-3 rounded-5 border border-2 border-black">
                My Polls
            </div>
            {!account.isConnected ? (
                <div className="w-75 bg-light h-auto rounded-5 border border-2 border-black d-flex align-items-center justify-content-center py-5 mb-5">
                    <span className="fs-4 text-center fw-bold text-muted">
                        Connect wallet to view your polls
                    </span>
                </div>
            ) : numPollsCreated === 0 ? (
                <div className="w-75 bg-light h-auto rounded-5 border border-2 border-black d-flex align-items-center justify-content-center py-5 mb-5">
                    <span className="fs-4 text-center fw-bold text-muted">
                        You haven't created any polls yet
                    </span>
                </div>
            ) : (
                <>
                    {/* Only show pagination if there are multiple pages */}
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
                                    First
                                </button>
                                <button 
                                    type="button" 
                                    className="btn fw-bold custom-hover d-flex align-items-center rounded-5 mx-1 p-sm-3 p-2" 
                                    style={{ backgroundColor: "#9e42f5", color: "white", border: "0" }} 
                                    onClick={() => handleSetPage(page - 1)} 
                                    disabled={page === 1}
                                >
                                    &lt;&lt;
                                </button>
                                {visiblePages.map((p) => (
                                    <button 
                                        key={p} 
                                        type="button" 
                                        className="btn fw-bold d-flex align-items-center rounded-5 mx-1 p-sm-3 p-2 custom-hover" 
                                        style={{ 
                                            backgroundColor: "#9e42f5", 
                                            color: "white", 
                                            border: "0", 
                                            outline: page === p ? "4px solid black" : "none" 
                                        }} 
                                        onClick={() => handleSetPage(p)}
                                    >
                                        {p}
                                    </button>
                                ))}
                                <button 
                                    type="button" 
                                    className="btn fw-bold custom-hover d-flex align-items-center rounded-5 mx-1 p-sm-3 p-2" 
                                    style={{ backgroundColor: "#9e42f5", color: "white", border: "0" }} 
                                    onClick={() => handleSetPage(page + 1)} 
                                    disabled={page === totalPages}
                                >
                                    &gt;&gt;
                                </button>
                                <button
                                    className="btn fw-bold rounded-5 custom-hover d-flex align-items-center mx-1 p-sm-3 p-2"
                                    type="button"
                                    style={{ backgroundColor: "#9e42f5", color: "white", border: "0" }}
                                    onClick={() => handleSetPage(totalPages)}
                                    disabled={page === totalPages}
                                >
                                    Last
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="list-group h-auto w-75 gap-5 mb-4">
                        {pollIds.map((pollId) => (
                            <div
                                key={pollId}
                                className="d-flex align-items-center justify-content-center list-group-item h-auto pb-5 pt-3 border border-2 border-black rounded-5"
                            >
                                <PollDetailsByIdOnLoad pollId={pollId} />
                            </div>
                        ))}
                    </div>

                    {/* Bottom pagination - only show if there are multiple pages */}
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
                                    First
                                </button>
                                <button 
                                    type="button" 
                                    className="btn fw-bold custom-hover d-flex align-items-center rounded-5 mx-1 p-sm-3 p-2" 
                                    style={{ backgroundColor: "#9e42f5", color: "white", border: "0" }} 
                                    onClick={() => handleSetPage(page - 1)} 
                                    disabled={page === 1}
                                >
                                    &lt;&lt;
                                </button>
                                {visiblePages.map((p) => (
                                    <button 
                                        key={p} 
                                        type="button" 
                                        className="btn fw-bold d-flex align-items-center rounded-5 mx-1 p-sm-3 p-2 custom-hover" 
                                        style={{ 
                                            backgroundColor: "#9e42f5", 
                                            color: "white", 
                                            border: "0", 
                                            outline: page === p ? "4px solid black" : "none" 
                                        }} 
                                        onClick={() => handleSetPage(p)}
                                    >
                                        {p}
                                    </button>
                                ))}
                                <button 
                                    type="button" 
                                    className="btn fw-bold custom-hover d-flex align-items-center rounded-5 mx-1 p-sm-3 p-2" 
                                    style={{ backgroundColor: "#9e42f5", color: "white", border: "0" }} 
                                    onClick={() => handleSetPage(page + 1)} 
                                    disabled={page === totalPages}
                                >
                                    &gt;&gt;
                                </button>
                                <button
                                    className="btn fw-bold rounded-5 custom-hover d-flex align-items-center mx-1 p-sm-3 p-2"
                                    type="button"
                                    style={{ backgroundColor: "#9e42f5", color: "white", border: "0" }}
                                    onClick={() => handleSetPage(totalPages)}
                                    disabled={page === totalPages}
                                >
                                    Last
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
