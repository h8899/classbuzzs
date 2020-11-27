// React
import React, { Component } from 'react';
import { connect } from 'react-redux';

// Material UI
import { Paper, Grid, Button, Typography, TextField, CircularProgress } from '@material-ui/core';

// Project
import { LOGIN_USER } from '../actions/';
import { loginUser } from '../actions/authActions';
import Navigation from '../navigation';
import LoginBg from './LoginBg';
import logo from '../assets/logo.svg';

class LoginBox extends Component {
    state = {
        username: '',
        password: ''
    };

    handleChange = ({ target }) => {
        this.setState({
            [target.name]: target.value
        });
    };

    onLogin = (e) => {
        e.preventDefault();
        if (this.props.type !== 'forgot') {
            this.props.loginUser(this.state.username, this.state.password);
        }
    };

    render() {
        const { loading } = this.props;
        const isLoading = loading[LOGIN_USER];
        const isForgot = this.props.type === 'forgot';
        let formBody;

        if (isForgot) {
            formBody = (
                <Grid container spacing={32}>
                    <Grid item xs={12}>
                        <TextField
                            name="username"
                            label="Username"
                            value={this.state.username}
                            onChange={this.handleChange}
                            fullWidth
                        />
                    </Grid>
                    <Grid item xs={12} className="login-progress-wrapper">
                        <Button variant="contained" color="primary" type="submit" disabled={isLoading} fullWidth>
                            Reset Password
                        </Button>
                        {isLoading && <CircularProgress size={24} className="login-progress-circular" />}
                    </Grid>
                    <Grid item xs={12} className="no-padding-top">
                        <Button
                            variant="outlined"
                            onClick={() => {
                                Navigation.push('/');
                            }}
                            fullWidth>
                            Login
                        </Button>
                    </Grid>
                </Grid>
            );
        } else {
            formBody = (
                <Grid container spacing={32}>
                    <Grid item xs={12}>
                        <TextField
                            name="username"
                            label="Username"
                            value={this.state.username}
                            onChange={this.handleChange}
                            fullWidth
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            name="password"
                            label="Password"
                            type="password"
                            value={this.state.password}
                            onChange={this.handleChange}
                            fullWidth
                        />
                    </Grid>
                    <Grid item xs={12} className="login-progress-wrapper">
                        <Button variant="contained" color="primary" type="submit" disabled={isLoading} fullWidth>
                            Login
                        </Button>
                        {isLoading && <CircularProgress size={24} className="login-progress-circular" />}
                    </Grid>
                    {/* FIXME: Allow password reset */}
                    <Grid item xs={12} className="no-padding-top none-display">
                        <Button
                            variant="outlined"
                            onClick={() => {
                                Navigation.push('/forgot');
                            }}
                            fullWidth>
                            Forgot password?
                        </Button>
                    </Grid>
                </Grid>
            );
        }

        return (
            <Paper className="login-box">
                <div className="anim login-header-bg">
                    <LoginBg />
                </div>
                <div className="img-contain login-logo" style={{ backgroundImage: `url('${logo}')` }}></div>
                <Typography variant="h3" className="mb-5 break-word login-title" align="center">
                    Class
                    <b>Buzz</b>
                </Typography>
                {/*<Typography variant="h5" className="trans-1 mb-1" gutterBottom>
                    {isForgot ? 'Forgot Password' : 'Login'}
                </Typography>*/}
                {isForgot && (
                    <Typography className="trans-3 mb-4 text-justify">
                        Enter your username below and we will send you the password reset instruction via email
                    </Typography>
                )}
                <form noValidate autoComplete="off" onSubmit={this.onLogin}>
                    {formBody}
                </form>
            </Paper>
        );
    }
}

const mapStateToProps = (state) => ({
    auth: state.auth,
    loading: state.loading
});

export default connect(
    mapStateToProps,
    { loginUser }
)(LoginBox);
