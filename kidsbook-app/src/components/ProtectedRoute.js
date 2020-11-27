// React
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Route, Redirect } from 'react-router';

// Project
import { loginUser } from '../actions/authActions';

class ProtectedRoute extends Component {
    render() {
        const { auth, render, ...rest } = this.props;

        return (
            <Route
                {...rest}
                render={(props) =>
                    auth.effectiveToken && auth.effectiveUser ? (
                        render(props)
                    ) : (
                        <Redirect
                            to={{
                                pathname: '/',
                                state: { from: props.location }
                            }}
                        />
                    )
                }
            />
        );
    }
}

const mapStateToProps = (state) => ({
    auth: state.auth
});

export default connect(
    mapStateToProps,
    { loginUser }
)(ProtectedRoute);
