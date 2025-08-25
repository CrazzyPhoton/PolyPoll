import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';

export function Navbar() {
    const [searchInput, setSearchInput] = useState('');
    const navigate = useNavigate();

    const handleSearch = (e) => {
        e.preventDefault();
        const trimmed = searchInput.trim();
        if (!trimmed || isNaN(Number(trimmed))) return;
        // Navigate with pollId as query param
        navigate(`/all-polls?pollId=${trimmed}`);
        // Close offcanvas after search on mobile
        const offcanvasElement = document.getElementById('navbarOffcanvas');
        if (offcanvasElement) {
            const offcanvas = window.bootstrap?.Offcanvas?.getInstance(offcanvasElement);
            if (offcanvas) offcanvas.hide();
        }
    };

    const handleNavLinkClick = () => {
        // Close offcanvas when nav link is clicked on mobile
        const offcanvasElement = document.getElementById('navbarOffcanvas');
        if (offcanvasElement) {
            const offcanvas = window.bootstrap?.Offcanvas?.getInstance(offcanvasElement);
            if (offcanvas) offcanvas.hide();
        }
    };

    return (
        <nav className="navbar navbar-expand-lg bg-dark sticky-top shadow-sm">
            <div className="container-fluid px-2 px-sm-3 px-lg-4">
                {/* Brand Logo - Responsive */}
                <NavLink
                    className="navbar-brand text-light fw-bold fs-2 text-decoration-none py-2 py-lg-2 ms-1 me-lg-4 me-xl-5"
                    to="/"
                    end
                    style={{ fontSize: "clamp(1.25rem, 4vw, 1.75rem)" }}
                    onClick={handleNavLinkClick}
                >
                    PolyPoll
                </NavLink>

                {/* Responsive Toggler Button */}
                <button
                    className="navbar-toggler border-0 p-2 shadow-none"
                    type="button"
                    data-bs-toggle="offcanvas"
                    data-bs-target="#navbarOffcanvas"
                    aria-controls="navbarOffcanvas"
                    aria-expanded="false"
                    aria-label="Toggle navigation"
                    style={{
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                        borderRadius: "0.375rem"
                    }}
                >
                    <span className="navbar-toggler-icon filter-invert"></span>
                </button>

                {/* Desktop Navigation - Visible on lg+ screens */}
                <div className="collapse navbar-collapse d-none d-lg-flex">
                    <div className="d-flex w-100 align-items-center">
                        {/* Navigation Links - Fixed width section */}
                        <div style={{ minWidth: "280px", width: "280px" }}>
                            <ul className="navbar-nav d-flex flex-row gap-3 gap-lg-2 gap-xl-3 mb-0">
                                <li className="nav-item">
                                    <NavLink
                                        to="/"
                                        className={({ isActive }) =>
                                            "nav-link fw-medium px-3 py-2 rounded-3 transition-all" +
                                            (isActive ? " text-white" : " text-white-50 hover-text-white")
                                        }
                                        style={({ isActive }) => ({
                                            // fontSize: "clamp(0.875rem, 1.5vw, 1rem)",
                                            backgroundColor: isActive ? "#9e42f5" : "transparent"
                                        })}
                                        end
                                    >
                                        Home
                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink
                                        to="/all-polls"
                                        className={({ isActive }) =>
                                            "nav-link fw-medium px-3 py-2 rounded-3 transition-all text-nowrap" +
                                            (isActive ? " text-white" : " text-white-50 hover-text-white")
                                        }
                                        style={({ isActive }) => ({
                                            // fontSize: "clamp(0.875rem, 1.5vw, 1rem)",
                                            backgroundColor: isActive ? "#9e42f5" : "transparent"
                                        })}
                                    >
                                        All Polls
                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink
                                        to="/my-polls"
                                        className={({ isActive }) =>
                                            "nav-link fw-medium px-3 py-2 rounded-3 transition-all text-nowrap" +
                                            (isActive ? " text-white" : " text-white-50 hover-text-white")
                                        }
                                        style={({ isActive }) => ({
                                            // fontSize: "clamp(0.875rem, 1.5vw, 1rem)",
                                            backgroundColor: isActive ? "#9e42f5" : "transparent"
                                        })}
                                    >
                                        My Polls
                                    </NavLink>
                                </li>
                            </ul>
                        </div>

                        {/* Search Form - Centered section */}
                        <div className="flex-grow-1 d-flex justify-content-center px-3">
                            <div style={{ width: "100%", maxWidth: "350px" }}>
                                <form className="d-flex" role="search" onSubmit={handleSearch}>
                                    <input
                                        className="form-control me-2 fw-medium border-0 shadow-sm py-2 py-xl-2"
                                        type="search"
                                        placeholder="Enter Poll ID"
                                        aria-label="Search"
                                        value={searchInput}
                                        onChange={(e) => setSearchInput(e.target.value)}
                                        style={{
                                            backgroundColor: "rgba(255, 255, 255, 0.9)",
                                            // fontSize: "clamp(0.875rem, 1.5vw, 0.9375rem)",
                                            height: "40px"
                                        }}
                                    />
                                    <button
                                        className="btn fw-medium text-nowrap shadow-sm py-2 py-xl-2 px-3 px-xl-3"
                                        type="submit"
                                        style={{
                                            backgroundColor: "#9e42f5",
                                            color: "white",
                                            border: "none",
                                            // fontSize: "clamp(0.75rem, 1.5vw, 0.875rem)",
                                            minWidth: "fit-content",
                                            height: "40px"
                                        }}
                                    >
                                        <span className="d-none d-xl-inline">Search Poll</span>
                                        <span className="d-xl-none">Search</span>
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* Wallet Connection - Fixed width section */}
                        <div style={{ minWidth: "280px", width: "280px" }} className="d-flex justify-content-end"> {/* Changed from minWidth: "200px" to fixed width */}
                            <div>
                                <appkit-button className="btn p-0 text-nowrap w-100" type="button"></appkit-button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Offcanvas Sidebar */}
                <div
                    className="offcanvas offcanvas-end bg-dark text-white d-lg-none"
                    tabIndex="-1"
                    id="navbarOffcanvas"
                    aria-labelledby="navbarOffcanvasLabel"
                    style={{ width: "min(85vw, 320px)" }}
                >
                    {/* Offcanvas Header */}
                    <div className="offcanvas-header border-bottom border-secondary pb-3">
                        <h5 className="offcanvas-title fw-bold" id="navbarOffcanvasLabel" style={{ fontSize: "clamp(1.1rem, 3vw, 1.25rem)" }}>
                            Menu
                        </h5>
                        <button
                            type="button"
                            className="btn-close btn-close-white shadow-none"
                            data-bs-dismiss="offcanvas"
                            aria-label="Close"
                            style={{ fontSize: "1.2rem" }}
                        ></button>
                    </div>

                    {/* Offcanvas Body */}
                    <div className="offcanvas-body py-4">
                        {/* Mobile Navigation Links */}
                        <ul className="navbar-nav mb-4">
                            <li className="nav-item mb-2">
                                <NavLink
                                    to="/"
                                    className={({ isActive }) =>
                                        "nav-link fw-medium px-3 py-3 rounded-3 d-flex align-items-center transition-all" +
                                        (isActive ? " text-white" : " text-white-50")
                                    }
                                    style={({ isActive }) => ({
                                        fontSize: "clamp(1rem, 3vw, 1.125rem)",
                                        minHeight: "48px",
                                        backgroundColor: isActive ? "#9e42f5" : "transparent"
                                    })}
                                    end
                                    onClick={handleNavLinkClick}
                                >
                                    <svg className="me-3" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                                    </svg>
                                    Home
                                </NavLink>
                            </li>
                            <li className="nav-item mb-2">
                                <NavLink
                                    to="/all-polls"
                                    className={({ isActive }) =>
                                        "nav-link fw-medium px-3 py-3 rounded-3 d-flex align-items-center transition-all" +
                                        (isActive ? " text-white" : " text-white-50")
                                    }
                                    style={({ isActive }) => ({
                                        fontSize: "clamp(1rem, 3vw, 1.125rem)",
                                        minHeight: "48px",
                                        backgroundColor: isActive ? "#9e42f5" : "transparent"
                                    })}
                                    onClick={handleNavLinkClick}
                                >
                                    <svg className="me-3" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
                                    </svg>
                                    All Polls
                                </NavLink>
                            </li>
                            <li className="nav-item mb-4">
                                <NavLink
                                    to="/my-polls"
                                    className={({ isActive }) =>
                                        "nav-link fw-medium px-3 py-3 rounded-3 d-flex align-items-center transition-all" +
                                        (isActive ? " text-white" : " text-white-50")
                                    }
                                    style={({ isActive }) => ({
                                        fontSize: "clamp(1rem, 3vw, 1.125rem)",
                                        minHeight: "48px",
                                        backgroundColor: isActive ? "#9e42f5" : "transparent"
                                    })}
                                    onClick={handleNavLinkClick}
                                >
                                    <svg className="me-3" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M10,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V8C22,6.89 21.1,6 20,6H12L10,4Z" />
                                    </svg>
                                    My Polls
                                </NavLink>
                            </li>
                        </ul>

                        {/* Mobile Search Form */}
                        <div className="mb-4">
                            <h6 className="text-white-50 mb-3 fw-medium" style={{ fontSize: "clamp(0.875rem, 2.5vw, 1rem)" }}>
                                Search Polls
                            </h6>
                            <form className="d-flex flex-column gap-3" role="search" onSubmit={handleSearch}>
                                <input
                                    className="form-control border-0 shadow-sm py-3"
                                    type="search"
                                    placeholder="Enter Poll ID"
                                    aria-label="Search"
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    style={{
                                        backgroundColor: "rgba(255, 255, 255, 0.9)",
                                        fontSize: "clamp(1rem, 3vw, 1.125rem)",
                                        minHeight: "48px"
                                    }}
                                />
                                <button
                                    className="btn fw-medium py-3 w-100 shadow-sm"
                                    type="submit"
                                    style={{
                                        backgroundColor: "#9e42f5",
                                        color: "white",
                                        border: "none",
                                        fontSize: "clamp(1rem, 3vw, 1.125rem)",
                                        minHeight: "48px"
                                    }}
                                >
                                    Search Poll
                                </button>
                            </form>
                        </div>

                        {/* Mobile Wallet Connection */}
                        <div className="border-top border-secondary pt-4 mt-auto">
                            <h6 className="text-white-50 mb-3 fw-medium" style={{ fontSize: "clamp(0.875rem, 2.5vw, 1rem)" }}>
                                Wallet Connection
                            </h6>
                            <div className="d-flex justify-content-center">
                                <appkit-button className="btn p-0 text-nowrap w-100" type="button" style={{ minHeight: "48px" }}></appkit-button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom Styles */}
            <style jsx>{`
                .filter-invert {
                    filter: invert(1);
                }
                
                .transition-all {
                    transition: all 0.2s ease-in-out;
                }
                
                .hover-text-white:hover {
                    color: white !important;
                    background-color: rgba(255, 255, 255, 0.1);
                }
                
                .nav-link:hover {
                    transform: translateY(-1px);
                }
                
                .btn:hover {
                    transform: translateY(-1px);
                }
                
                @media (max-width: 991.98px) {
                    .offcanvas {
                        backdrop-filter: blur(10px);
                    }
                }
                
                .offcanvas-backdrop {
                    backdrop-filter: blur(4px);
                }
            `}</style>
        </nav>
    );
}
