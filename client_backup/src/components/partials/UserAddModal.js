import React, { Component } from 'react';
import classnames from "classnames";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { addUser } from "../../actions/userActions";
import { withRouter } from "react-router-dom";
import { toast } from 'react-toastify';

import 'react-toastify/dist/ReactToastify.css';

class UserAddModal extends Component {
    constructor(props) {
        super(props);
        this.state = {
            name: "",
            email: "",
            password: "",
            password2: "",
            userString: "",
            errors: {}
        };
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.errors) {
            this.setState({
                errors: nextProps.errors
            });
        }
        if (
            nextProps.auth.user &&
            nextProps.auth.user.data &&
            nextProps.auth.user.data.message
        ) {
            toast(nextProps.auth.user.data.message, {
                position: toast.POSITION.TOP_CENTER
            });
            this.props.handleClose();
        }
    }

    onChange = e => {
        this.setState({ [e.target.id]: e.target.value });
    };

    onUserAdd = e => {
        e.preventDefault();
        const newUser = {
            name: this.state.name,
            email: this.state.email,
            password: this.state.password,
            password2: this.state.password2,
            userString: this.state.userString
        };
        this.props.addUser(newUser, this.props.history);
    };

    render() {
        const { errors } = this.state;
        return (
            <div className={`modal ${this.props.show ? 'show' : ''}`} id="add-user-modal" tabIndex="-1" role="dialog" aria-labelledby="addUserModalLabel" style={{ display: this.props.show ? 'block' : 'none' }}>
                <div className="modal-dialog modal-lg" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="addUserModalLabel">Add User</h5>
                            <button type="button" className="close" onClick={this.props.handleClose} aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <form noValidate onSubmit={this.onUserAdd} id="add-user">
                                <div className="form-group">
                                    <label htmlFor="name">Name</label>
                                    <input
                                        onChange={this.onChange}
                                        value={this.state.name}
                                        id="name"
                                        type="text"
                                        className={classnames("form-control", {
                                            invalid: errors.name
                                        })}
                                    />
                                    <span className="text-danger">{errors.name}</span>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="email">Email</label>
                                    <input
                                        onChange={this.onChange}
                                        value={this.state.email}
                                        id="email"
                                        type="email"
                                        className={classnames("form-control", {
                                            invalid: errors.email
                                        })}
                                    />
                                    <span className="text-danger">{errors.email}</span>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="userString">userString</label>
                                    <input
                                        onChange={this.onChange}
                                        value={this.state.userString}
                                        id="userString"
                                        type="text"
                                        className={classnames("form-control", {
                                            invalid: errors.userString
                                        })}
                                    />
                                    <span className="text-danger">{errors.email}</span>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="password">Password</label>
                                    <input
                                        onChange={this.onChange}
                                        value={this.state.password}
                                        id="password"
                                        type="password"
                                        className={classnames("form-control", {
                                            invalid: errors.password
                                        })}
                                    />
                                    <span className="text-danger">{errors.password}</span>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="password2">Confirm Password</label>
                                    <input
                                        onChange={this.onChange}
                                        value={this.state.password2}
                                        id="password2"
                                        type="password"
                                        className={classnames("form-control", {
                                            invalid: errors.password2
                                        })}
                                    />
                                    <span className="text-danger">{errors.password2}</span>
                                </div>
                            </form>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={this.props.handleClose}>Close</button>
                            <button form="add-user" type="submit" className="btn btn-primary" onClick={this.onUserAdd}>Add User</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

UserAddModal.propTypes = {
    addUser: PropTypes.func.isRequired,
    auth: PropTypes.object.isRequired,
    errors: PropTypes.object.isRequired,
    show: PropTypes.bool.isRequired,
    handleClose: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
    auth: state.auth,
    errors: state.errors
});

export default connect(
    mapStateToProps,
    { addUser }
)(withRouter(UserAddModal));
