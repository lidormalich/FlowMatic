import React from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignOutAlt } from "@fortawesome/free-solid-svg-icons";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../../actions/authActions";

const Navbar = () => {
    const dispatch = useDispatch();
    const auth = useSelector(state => state.auth);
    const { user } = auth;

    const onLogoutClick = e => {
        e.preventDefault();
        dispatch(logoutUser());
    };

    return (
        <div className="container-fluid p-0" dir="rtl"> {/* הוספת dir="rtl" */}
            <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
                <a className="navbar-brand" href="/">Brand</a>
                <button className="navbar-toggler" type="button" data-toggle="collapse"
                        data-target="#navbarNavDropdown" aria-controls="navbarNavDropdown" aria-expanded="false"
                        aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarNavDropdown">
                    <ul className="navbar-nav mr-auto"> {/* החלפת ml-auto ב-mr-auto */}
                        <li className="nav-item dropdown">
                            <a className="nav-link dropdown-toggle" href="#" id="settings"
                               data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                הגדרות
                            </a>
                            <div className="dropdown-menu" aria-labelledby="settings">
                                <a className="dropdown-item" href="#" onClick={onLogoutClick}>התנתק</a>
                            </div>
                        </li>
                        <li className="nav-item active ">
                            <a className="nav-link" href="#" onClick={onLogoutClick}>התנתק ({user.name}) <FontAwesomeIcon icon={faSignOutAlt} /> </a>
                        </li>
                    </ul>
                </div>
            </nav>
        </div>
    );
};

Navbar.propTypes = {
    logoutUser: PropTypes.func.isRequired,
    auth: PropTypes.object.isRequired
};

export default Navbar;
