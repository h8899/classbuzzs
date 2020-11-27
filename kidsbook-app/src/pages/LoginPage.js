import React, { Component } from 'react';
import LoginBox from '../components/LoginBox';
import LoginBg from '../components/LoginBg';
import AnchorLink from '../components/AnchorLink';
import Typography from '@material-ui/core/Typography';

class LoginPage extends Component {
    render() {
        return (
            <div className="pos-relative" style={{ width: '100%', minHeight: '100%' }}>
                <div className="pos-absolute absolute-fit login-bg z-index-back">
                    <LoginBg />
                </div>
                <div className="anim page-login">
                    <LoginBox />
                    <div className="login-footer">
                        <Typography color="inherit" className="line-compact">
                            ClassBuzz by CS3216 Group 1
                        </Typography>
                        <Typography color="inherit" className="font-smaller trans-2 line-compact mb-1">
                            Ang YC . Hieu . Herald . Sreyans . Son
                        </Typography>
                        <AnchorLink href="https://www.freepik.com/">
                            <Typography color="inherit" className="font-smallest trans-2 line-compact">
                                Background designed by Freepik
                            </Typography>
                        </AnchorLink>
                    </div>
                </div>
            </div>
        );
    }
}

export default LoginPage;
