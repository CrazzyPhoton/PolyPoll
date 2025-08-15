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
        <nav className="navbar navbar-expand-lg bg-dark">
            <div className="container-fluid d-flex flex-lg-row align-items-lg-center justify-content-lg-between justify-content-md-between py-lg-1 py-0 flex-column">
                <div className='d-flex flex-lg-row align-items-lg-center ms-lg-3 ms-0 flex-column align-items-center me-lg-5 me-0'>
                    <NavLink
                        className="text-light fw-bold fs-2 text-decoration-none me-lg-5 me-0 mb-lg-0 mb-4"
                        to="/"
                        end
                    >PolyPoll</NavLink>
                    <ul className="d-flex gap-5 list-unstyled my-lg-2 ms-0 ms-lg-3">
                        <li className="nav-item me-2">
                            <NavLink
                                to="/"
                                className={({ isActive }) =>
                                    "nav-link fw-medium nav-link-custom" + (isActive ? " text-white" : " text-white opacity-50")
                                }
                                end
                            >Home</NavLink>
                        </li>
                        <li className="nav-item mx-2 text-nowrap">
                            <NavLink
                                to="/all-polls"
                                className={({ isActive }) =>
                                    "nav-link fw-medium nav-link-custom" + (isActive ? " text-white" : " text-white opacity-50")
                                }
                            >All Polls</NavLink>
                        </li>
                        <li className="nav-item ms-2 text-nowrap">
                            <NavLink
                                to="/my-polls"
                                className={({ isActive }) =>
                                    "nav-link fw-medium nav-link-custom" + (isActive ? " text-white" : " text-white opacity-50")
                                }
                            >My Polls</NavLink>
                        </li>
                    </ul>
                </div>
                <div className="mt-lg-0 mt-1 ms-lg-5 ms-0 d-flex justify-content-lg-start flex-fill">
                    <form className="d-flex" role="search" onSubmit={handleSearch}>
                        <input className="form-control me-2 focus-ring focus-ring-dark" type="search" placeholder="Enter Poll ID" aria-label="Search" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
                        <button className="btn fw-medium custom-hover w-auto text-nowrap" type="submit" style={{ backgroundColor: "#9e42f5", color: "white"}}>Search Poll</button>
                    </form>
                </div>
                <div className="mt-lg-0 mt-4 mb-lg-0 mb-3 me-lg-3 me-0 ms-lg-5 ms-0">
                    <appkit-button className="btn p-0 text-nowrap me-2" type="button"></appkit-button>
                </div>
            </div>
        </nav>
    )
}
