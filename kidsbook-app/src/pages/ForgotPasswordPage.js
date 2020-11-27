import React, { Component } from 'react';
import LoginBox from '../components/LoginBox';

class ForgotPasswordPage extends Component {
    render() {
        return (
            <div className="bg anim page-login">
                <LoginBox type="forgot" />
            </div>
        );
    }
}

export default ForgotPasswordPage;
