import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import Dashboard from "./components/pages/Dashboard";
import React, { Component } from 'react';
import Login from "./components/auth/Login";
import NotFound from "./components/layout/NotFound";
import { Provider } from "react-redux";
import PrivateRoute from "./components/private-route/PrivateRoute";
import Register from "./components/auth/Register";
import store from "./store";
import jwt_decode from "jwt-decode";
import setAuthToken from "./utils/setAuthToken";
import { setCurrentUser, logoutUser } from "./actions/authActions";

import './App.css';
import '../node_modules/bootstrap/dist/css/bootstrap.css';
import '../node_modules/bootstrap/dist/js/bootstrap';
import '../node_modules/font-awesome/css/font-awesome.css';
import '../node_modules/jquery/dist/jquery.min';
import '../node_modules/popper.js/dist/popper';

import 'bootstrap/dist/css/bootstrap.min.css';


import User from "./components/pages/Users";
import Events from "./components/pages/Events";
import AppointmentScheduler from "./components/pages/AppointmentScheduler";

if (localStorage.jwtToken) {
    const token = localStorage.jwtToken;
    setAuthToken(token);
    const decoded = jwt_decode(token);
    store.dispatch(setCurrentUser(decoded));
    const currentTime = Date.now() / 1000;
    if (decoded.exp < currentTime) {
        store.dispatch(logoutUser());
        window.location.href = "./login";
    }
}
const users = ["lidor", "admin", "user"];
class App extends Component {
    render () {
        return (
            <Provider store={store}>
                <Router>
                    <div className="App" dir="rtl">
                        <Switch>
                            <Route exact path="/" component={Login} />
                            <Route exact path="/register" component={Register} />
                            <Route exact path="/login" component={Login} /> 
                            {/* {users.map((user, index) => {    return (
                                <Route
                                key={index} 
                                exact 
                                path={"/" + user + "/AppointmentScheduler"} 
                                render={(props) => <Dashboard {...props} user={user} />}
                            />
                                );
                            })} */}
                            <Route exact path="/:user/AppointmentScheduler" component={AppointmentScheduler} />
                            <Route exact path="/AppointmentScheduler" component={AppointmentScheduler} />

                            <Switch>
                                <PrivateRoute exact path="/dashboard" component={Dashboard} />
                                <PrivateRoute exact path="/users" component={User} />
                                <PrivateRoute exact path="/events" component={Events} />
                            </Switch>
                            <Route exact path="*" component={NotFound} />
                        </Switch>
                    </div>
                </Router>
            </Provider>
        );
    }
}

export default App;
