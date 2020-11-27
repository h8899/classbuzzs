// React
import React, { Component } from 'react';
import { connect } from 'react-redux';
import isObject from 'is-object';

// Material UI
import {
    Divider,
    LinearProgress,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Popover,
    Typography
} from '@material-ui/core';

// Project
import Avatar from './Avatar';
import RouterLink from './RouterLink';
import { GET_ALL_VIRTUAL, SWITCH_USER } from '../actions/';
import { switchUser } from '../actions/authActions';
import LoadingHelper from '../utils/LoadingHelper';
import { UserFormatter } from '../utils/formatter';

class MainAppProfile extends Component {
    state = {
        switchProcessing: false
    };

    static getDerivedStateFromProps(nextProps, prevState) {
        const isProcessing = Boolean(nextProps.loading[SWITCH_USER]);
        const newState = {};

        if (isProcessing !== prevState.switchProcessing) {
            newState.switchProcessing = isProcessing;

            if (!isProcessing && prevState.switchProcessing) {
                LoadingHelper.hide();
            } else if (isProcessing && !prevState.switchProcessing) {
                LoadingHelper.show('Switching user');
            }
        }

        return {
            ...prevState,
            ...newState
        };
    }

    handleSwitchUser = (email, realId) => () => {
        this.props.switchUser(email, realId);
        this.props.onClose();
    };

    render() {
        const { auth, loading, user } = this.props;
        const currentUser = UserFormatter.show(user[auth.effectiveUser]);
        const realUser = UserFormatter.show(user[auth.realUser]);

        const profiles = auth.virtualUsers.filter((u) => isObject(user[u])).map((u) => UserFormatter.show(user[u]));
        const isLoading = loading[GET_ALL_VIRTUAL];
        const isSuperuser = realUser.isSuperuser;

        return (
            <Popover
                anchorEl={this.props.anchorEl}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                open={this.props.open}
                onClose={this.props.onClose}
                transitionDuration={200}
                className="app-profile">
                <div className="app-profile-container pos-relative">
                    <div className="flex-display app-profile-inner overflow-hidden">
                        <Avatar src={currentUser.photo} text={currentUser.username} className="avatar-big flex-show" />
                        <div className="flex-grow ml-2 flex-display flex-column flex-align-start flex-justify-center overflow-hidden">
                            <Typography color="primary" className="font-larger line-compact" noWrap>
                                <RouterLink to="/profile">
                                    <b>{currentUser.username}</b>
                                </RouterLink>
                            </Typography>
                            <Typography className="trans-2 line-compact" noWrap>
                                {currentUser.email}
                            </Typography>
                        </div>
                    </div>
                    {isSuperuser && (
                        <>
                            <Divider />
                            {isLoading && <LinearProgress color="secondary" className="pos-absolute width-full" />}
                            <List>
                                <ListItem
                                    button
                                    onClick={this.handleSwitchUser(null, auth.realUser)}
                                    selected={auth.effectiveUser === auth.realUser}>
                                    <ListItemAvatar>
                                        <Avatar src={realUser.photo} text={realUser.username} />
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Typography className="line-compact" noWrap>
                                                <b>{realUser.username}</b>
                                            </Typography>
                                        }
                                    />
                                </ListItem>
                                {profiles.map((p) => (
                                    <ListItem
                                        key={p.id}
                                        button
                                        onClick={this.handleSwitchUser(p.email, auth.realUser)}
                                        selected={auth.effectiveUser === p.id}>
                                        <ListItemAvatar>
                                            <Avatar src={p.photo} text={p.username} />
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={
                                                <Typography className="line-compact" noWrap>
                                                    <b>{p.username}</b>
                                                </Typography>
                                            }
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </>
                    )}
                </div>
            </Popover>
        );
    }
}

const mapStateToProps = (state) => ({
    auth: state.auth,
    loading: state.loading,
    user: state.user
});

export default connect(
    mapStateToProps,
    { switchUser }
)(MainAppProfile);
