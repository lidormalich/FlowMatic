import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { useHistory } from "react-router-dom";
import { loginUser } from "../../actions/authActions";
import classnames from "classnames";

function Login({ loginUser, auth, errors }) {
  const [state, setState] = useState({
    email: "",
    password: "",
    errors: {}
  });
  
  const history = useHistory();

  useEffect(() => {
    if (auth.isAuthenticated) {
      history.push("/dashboard");
    }
  }, [auth.isAuthenticated, history]);

  useEffect(() => {
    if (errors) {
      setState((prevState) => ({ ...prevState, errors }));
    }
  }, [errors]);

  const onChange = (e) => {
    setState({ ...state, [e.target.id]: e.target.value });
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const userData = {
      email: state.email,
      password: state.password
    };
    loginUser(userData);
  };

  return (
    <div className="container">
      <div className="row mt-5">
        <div className="col-md-4 mx-auto mt-5 card shadow-lg">
          <div className="card-body p-1">
            <h2 className="text-center text-primary mt-3">Login</h2>
            <form noValidate onSubmit={onSubmit} className="white">
              <label htmlFor="email">Email</label>
              <input
                onChange={onChange}
                value={state.email}
                error={state.errors.email}
                id="email"
                type="email"
                className={classnames("form-control", {
                  invalid: state.errors.email
                })}
              />
              <span className="text-danger">{state.errors.email}</span>
              <br />
              <label htmlFor="password">Password</label>
              <input
                onChange={onChange}
                value={state.password}
                error={state.errors.password}
                id="password"
                type="password"
                className={classnames("form-control", {
                  invalid: state.errors.password
                })}
              />
              <span className="text-danger">{state.errors.password}</span>
              <p className="text-center pb-0 mt-2">
                <button
                  type="submit"
                  className="btn btn-large btn-primary mt-2 px-5"
                >
                  Login
                </button>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

Login.propTypes = {
  loginUser: PropTypes.func.isRequired,
  auth: PropTypes.object.isRequired,
  errors: PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
  auth: state.auth,
  errors: state.errors
});

export default connect(mapStateToProps, { loginUser })(Login);
