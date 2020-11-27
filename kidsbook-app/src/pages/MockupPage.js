// React
import React, { Component } from 'react';
import { Route, Switch as RouterSwitch, withRouter } from 'react-router';
import { connect } from 'react-redux';
import isObject from 'is-object';
import moment from 'moment';

// Material UI
import { CircularProgress, Typography } from '@material-ui/core';
import { withSnackbar } from 'notistack';

// Project
import SnackBarHelper from '../utils/SnackBarHelper';
import ProtectedRoute from '../components/ProtectedRoute';
import LoginPage from './LoginPage';
import ProfilePage from './ProfilePage';
import GroupsPage from './GroupsPage';
import FeedPage from './FeedPage';
import SettingsPage from './SettingsPage';
import GroupSettingsPage from './GroupSettingsPage';
import FlaggedPage from './FlaggedPage';
import AnalyticsPage from './AnalyticsPage';
import AccountsPage from './AccountsPage';
import ForgotPasswordPage from './ForgotPasswordPage';
import PostPage from './PostPage';
import ManagementPage from './ManagementPage';
import SurveysPage from './SurveysPage';
import SurveyPreviewPage from './SurveyPreviewPage';
import SurveyResponsePage from './SurveyResponsePage';
import GamesPage from './GamesPage';
import GamesPreviewPage from './GamesPreviewPage';
import { logoutUser } from '../actions/authActions';
import { fetchNotifications, getSettings } from '../actions/appActions';
import { getUser } from '../actions/userActions';
import { connectSocket, disconnectSocket, subscribeSocket } from '../actions/socketActions';
import { UserFormatter } from '../utils/formatter';
import history from '../history';

class MockupPage extends Component {
    state = {
        isLoading: true,
        hasError: false,
        activeUser: null,
        activeEffective: null,
        activeGroup: null
    };

    constructor(props) {
        super(props);
        SnackBarHelper.init(props.enqueueSnackbar);
        moment.locale('short', {
            relativeTime: {
                future: 'in %s',
                past: '%s ago',
                s: '~1s',
                ss: '%ss',
                m: '~1m',
                mm: '%dm',
                h: '~1h',
                hh: '%dh',
                d: '~1d',
                dd: '%dd',
                M: '~1M',
                MM: '%dM',
                y: '~1Y',
                yy: '%dY'
            }
        });
    }

    componentDidMount() {
        this.verifyToken();
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        const {
            auth,
            app,
            connectSocket,
            disconnectSocket,
            subscribeSocket,
            fetchNotifications,
            getSettings,
            user
        } = nextProps;
        const newState = {};

        if (prevState.activeUser !== auth.realUser) {
            newState.activeUser = auth.realUser;
            if (auth.realUser) {
                connectSocket(auth.realToken, UserFormatter.show(user[auth.realUser]).isSuperuser);
            } else {
                disconnectSocket();
            }
        }

        if (prevState.activeEffective !== auth.effectiveUser) {
            newState.activeEffective = auth.effectiveUser;
            if (auth.effectiveUser) {
                fetchNotifications();
                getSettings();
            }
        }

        if (prevState.activeGroup !== app.groupId) {
            newState.activeGroup = app.groupId;
            subscribeSocket(app.groupId);
        }

        return {
            ...prevState,
            ...newState
        };
    }

    static getDerivedStateFromError(error) {
        console.error(error);
        return { hasError: true };
    }

    verifyToken = async () => {
        const { auth, getUser, logoutUser } = this.props;
        if (auth.effectiveUser && auth.effectiveToken) {
            const user = await getUser(auth.effectiveUser);
            if (!user) {
                history.replace('/');
            } else if (isObject(this.props.location) && this.props.location.pathname === '/') {
                history.replace('/app');
            }
            // TODO: Don't logout for now until we found a better way to solve it
            /* if (e.message !== 'Network Error') {
                await logoutUser();
            } */
        } else {
            if (this.props.location.pathname !== '/') {
                history.replace('/');
            }
        }
        this.setState({ isLoading: false });
    };

    render() {
        const { isLoading, hasError } = this.state;

        const loading = (
            <div className="size-full flex-display flex-column flex-align-center flex-justify-center">
                <CircularProgress className="mb-2" size={80} thickness={2} />
                <Typography variant="h5">Loading...</Typography>
            </div>
        );

        const error = (
            <div className="size-full flex-display flex-column flex-align-center flex-justify-center">
                <Typography variant="h3" className="mb-2">
                    :(
                </Typography>
                <Typography>Something went wrong</Typography>
            </div>
        );

        const notFound = (
            <div className="size-full flex-display flex-column flex-align-center flex-justify-center">
                <Typography variant="h3" className="mb-0-5">
                    404
                </Typography>
                <Typography>Not Found</Typography>
            </div>
        );

        const router = (
            <RouterSwitch>
                <Route exact path="/" render={() => <LoginPage />} />
                <Route exact path="/forgot" render={() => <ForgotPasswordPage />} />
                <ProtectedRoute exact path="/app" render={() => <FeedPage />} />
                <ProtectedRoute exact path="/profile" render={(props) => <ProfilePage {...props} />} />
                <ProtectedRoute exact path="/profile/:userId" render={(props) => <ProfilePage {...props} />} />
                <ProtectedRoute exact path="/groups" render={() => <GroupsPage />} />
                <ProtectedRoute exact path="/settings" render={() => <SettingsPage />} />
                <ProtectedRoute exact path="/post/:postId" render={(props) => <PostPage {...props} />} />
                <ProtectedRoute exact path="/analytics" render={() => <AnalyticsPage />} />
                <ProtectedRoute exact path="/management" render={() => <ManagementPage />} />
                <ProtectedRoute exact path="/flagged" render={() => <FlaggedPage />} />
                <ProtectedRoute exact path="/groupsettings" render={() => <GroupSettingsPage />} />
                <ProtectedRoute exact path="/surveys" render={() => <SurveysPage />} />
                <ProtectedRoute exact path="/games" render={() => <GamesPage />} />
                <ProtectedRoute
                    exact
                    path="/games/:gameId/responses"
                    render={(props) => <GamesPreviewPage {...props} />}
                />
                <ProtectedRoute
                    exact
                    path="/survey/:surveyId/responses"
                    render={(props) => <SurveyPreviewPage {...props} />}
                />
                <ProtectedRoute exact path="/survey/:surveyId" render={(props) => <SurveyResponsePage {...props} />} />
                <ProtectedRoute exact path="/accounts" render={() => <AccountsPage />} />
                <Route render={() => notFound} />
            </RouterSwitch>
        );

        if (hasError) return error;
        if (isLoading) return loading;
        return router;
    }
}

const mapStateToProps = (state) => ({
    app: state.app,
    auth: state.auth,
    user: state.user
});

export default withRouter(
    withSnackbar(
        connect(
            mapStateToProps,
            { logoutUser, connectSocket, disconnectSocket, subscribeSocket, fetchNotifications, getSettings, getUser }
        )(MockupPage)
    )
);
