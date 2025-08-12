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
    };
    return (
        <nav className="navbar navbar-expand-lg bg-dark py-2">
            <div className="container-fluid d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center ms-3">
                    <NavLink
                        className="navbar-brand text-light fw-bold fs-3"
                        to="/"
                        end
                    >PolyPoll</NavLink>
                    <ul className="navbar-nav d-flex ms-4 gap-3">
                        <li className="nav-item mx-2">
                            <NavLink
                                to="/"
                                className={({ isActive }) =>
                                    "nav-link fw-medium nav-link-custom" + (isActive ? " text-white" : " text-white opacity-50")
                                }
                                end
                            >Home</NavLink>
                        </li>
                        <li className="nav-item mx-2">
                            <NavLink
                                to="/all-polls"
                                className={({ isActive }) =>
                                    "nav-link fw-medium nav-link-custom" + (isActive ? " text-white" : " text-white opacity-50")
                                }
                            >All Polls</NavLink>
                        </li>
                        <li className="nav-item mx-2">
                            <NavLink
                                to="/my-polls"
                                className={({ isActive }) =>
                                    "nav-link fw-medium nav-link-custom" + (isActive ? " text-white" : " text-white opacity-50")
                                }
                            >My Polls</NavLink>
                        </li>
                    </ul>
                </div>
                <form className="d-flex" style={{width: "35%"}} role="search" onSubmit={handleSearch}>
                    <input className="form-control me-2 focus-ring focus-ring-dark" type="search" placeholder="Enter Poll ID" aria-label="Search" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
                    <button className="btn fw-medium custom-hover" type="submit" style={{ backgroundColor: "#9e42f5", color: "white", width: "25%"}}>Search Poll</button>
                </form>
                <appkit-button className="btn btn-sm text-nowrap me-2"></appkit-button>
            </div>
        </nav>
    )
}
