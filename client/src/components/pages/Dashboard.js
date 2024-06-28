import React, { useContext } from "react";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
// import { logoutUser } from "../../actions/authActions";
import Navbar from "../partials/Navbar";
import Sidebar from "../partials/Sidebar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faList } from "@fortawesome/free-solid-svg-icons/faList";
import { Link } from "react-router-dom";
import { faUserAlt } from "@fortawesome/free-solid-svg-icons/faUserAlt";
// import { useParams } from "react-router-dom/cjs/react-router-dom";

const Dashboard = () => {
    const dispatch = useDispatch();
    const auth = useSelector(state => state.auth);

    const onLogoutClick = e => {
        e.preventDefault();
        // dispatch(logoutUser());
    };

    return (
        <div>
            <Navbar />
            <div className="d-flex" id="wrapper">
                <Sidebar />
                <div id="page-content-wrapper">
                    <div className="container-fluid">
                        <button className="btn btn-link mt-2" id="menu-toggle">
                            <FontAwesomeIcon icon={faList} />
                        </button>
                        <h1 className="mt-2 text-primary">Dashboard</h1>
                        <div className="row px-2">
                            <div className="col-sm-3 p-sm-2">
                                <div className="card bg-primary text-white shadow-lg">
                                    <div className="card-body">
                                        <h5 className="card-title">Users</h5>
                                        <p className="card-text">
                                            With supporting text below as a natural lead-in to additional content.
                                        </p>
                                        <Link to="/users" className="btn btn-light">
                                            <FontAwesomeIcon className="text-primary" icon={faUserAlt} /> Go to Users
                                        </Link>
                                    </div>
                                </div>
                            </div>
                            <div className="col-sm-3 p-sm-2">
                                <div className="card bg-secondary text-white shadow-lg">
                                    <div className="card-body">
                                        <h5 className="card-title">Special title treatment</h5>
                                        <p className="card-text">
                                            With supporting text below as a natural lead-in to additional content.
                                        </p>
                                        <a href="#" className="btn btn-light">Go somewhere</a>
                                    </div>
                                </div>
                            </div>
                            <div className="col-sm-3 p-sm-2">
                                <div className="card bg-info text-white shadow-lg">
                                    <div className="card-body">
                                        <h5 className="card-title">Special title treatment</h5>
                                        <p className="card-text">
                                            With supporting text below as a natural lead-in to additional content.
                                        </p>
                                        <a href="#" className="btn btn-light">Go somewhere</a>
                                    </div>
                                </div>
                            </div>
                            <div className="col-sm-3 p-sm-2">
                                <div className="card bg-dark text-white shadow-lg">
                                    <div className="card-body">
                                        <h5 className="card-title">Special title treatment</h5>
                                        <p className="card-text">
                                            With supporting text below as a natural lead-in to additional content.
                                        </p>
                                        <a href="#" className="btn btn-light">Go somewhere</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

Dashboard.propTypes = {
    // logoutUser: PropTypes.func.isRequired,
    auth: PropTypes.object.isRequired
};

export default Dashboard;
