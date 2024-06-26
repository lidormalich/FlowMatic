import React from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignOutAlt } from "@fortawesome/free-solid-svg-icons";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../../actions/authActions";
import { Link } from "react-router-dom";

const Sidebar = () => {
    const dispatch = useDispatch();
    const auth = useSelector(state => state.auth);

    const onLogoutClick = e => {
        e.preventDefault();
        dispatch(logoutUser());
    };

    return (
        <div className="border-right h-100" id="sidebar-wrapper">
            <div className="list-group list-group-flush">
                <Link to="/dashboard" className="list-group-item list-group-item-action">Dashboard</Link>
                <Link to="/users" className="list-group-item list-group-item-action">Users</Link>
                <Link to="/events" className="list-group-item list-group-item-action">Events</Link>
                <button className="list-group-item list-group-item-action" onClick={onLogoutClick}>Logout <FontAwesomeIcon icon={faSignOutAlt} /></button>
            </div>
        </div>
    );
};

Sidebar.propTypes = {
    logoutUser: PropTypes.func.isRequired,
    auth: PropTypes.object.isRequired
};

export default Sidebar;
