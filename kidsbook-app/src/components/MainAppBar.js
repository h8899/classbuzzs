// React
import React, { Component } from 'react';
import { connect } from 'react-redux';

// Material UI
import { AppBar, Badge, ButtonBase, LinearProgress, IconButton, Toolbar, Typography } from '@material-ui/core';
import {
    ArrowDropDown as ArrowDropDownIcon,
    Menu as MenuIcon,
    Notifications as NotificationsIcon
} from '@material-ui/icons';

// Project
import Avatar from './Avatar';
import MainAppDrawer from './MainAppDrawer';
import MainAppNoti from './MainAppNoti';
import MainAppProfile from './MainAppProfile';
import MainAppGroup from './MainAppGroup';
import { getSettings, fetchNotifications, seenNotifications } from '../actions/appActions';
import { getAllVirtual } from '../actions/userActions';
import { UserFormatter } from '../utils/formatter';

class MainAppBar extends Component {
    state = {
        anchorNoti: null,
        anchorProfile: null,
        anchorGroup: null,
        isDrawerOpen: false,
        items: []
    };

    handleDrawerClose = () => {
        this.setState({ isDrawerOpen: false });
    };

    handleDrawerOpen = () => {
        this.setState({ isDrawerOpen: true });
    };

    handleNotiOpen = (ev) => {
        this.props.fetchNotifications();
        this.props.seenNotifications();
        this.props.getSettings();
        this.setState({ anchorNoti: ev.currentTarget });
    };

    handleNotiClose = () => {
        this.setState({ anchorNoti: null });
    };

    handleProfileOpen = (ev) => {
        const { user, auth } = this.props;
        const currentUser = UserFormatter.show(user[auth.effectiveUser]);
        if (currentUser.isSuperuser) this.props.getAllVirtual();
        this.setState({ anchorProfile: ev.currentTarget });
    };

    handleProfileClose = () => {
        this.setState({ anchorProfile: null });
    };

    handleGroupOpen = (ev) => {
        this.setState({ anchorGroup: ev.currentTarget });
    };

    handleGroupClose = () => {
        this.setState({ anchorGroup: null });
    };

    render() {
        const { app, auth, group, user } = this.props;
        const { title, showLoading } = this.props;
        const { anchorNoti, anchorProfile, anchorGroup, isDrawerOpen } = this.state;

        const isNotiOpen = Boolean(anchorNoti);
        const isProfileOpen = Boolean(anchorProfile);
        const isGroupOpen = Boolean(anchorGroup);
        const unseenCount = isNaN(app.notification.unseen) ? 0 : app.notification.unseen;
        let { showGroupSelector, allowSwitchGroup } = this.props;

        showGroupSelector = showGroupSelector && Boolean(group[app.groupId]);
        allowSwitchGroup = allowSwitchGroup && Boolean(group[app.groupId]);
        const currentUser = user[auth.effectiveUser];

        const titleBar = (
            <div className="flex-display flex-column flex-justify-start overflow-hidden">
                {showGroupSelector && (
                    <div className="flex-display font-normal flex-align-center trans-1">
                        <Typography variant="h6" color="inherit" className="font-smaller line-none" noWrap>
                            {group[app.groupId].name}
                        </Typography>
                        <ArrowDropDownIcon fontSize="inherit" className="font-normal line-none" />
                    </div>
                )}
                <Typography variant="h6" color="inherit" className="line-none" align="left" noWrap>
                    {title}
                </Typography>
            </div>
        );

        return (
            <div className="app-bar">
                <AppBar position="fixed">
                    <Toolbar>
                        <IconButton
                            className="app-bar-action"
                            color="inherit"
                            aria-label="Open drawer"
                            onClick={this.handleDrawerOpen}>
                            <MenuIcon />
                        </IconButton>
                        {allowSwitchGroup ? (
                            <ButtonBase
                                aria-haspopup="true"
                                onClick={this.handleGroupOpen}
                                disableRipple
                                disableTouchRipple
                                className="flex-self-stretch overflow-hidden">
                                {titleBar}
                            </ButtonBase>
                        ) : (
                            titleBar
                        )}
                        <div className="flex-grow" />
                        <div className="flex-display flex-align-center">
                            <IconButton aria-haspopup="true" onClick={this.handleNotiOpen} color="inherit">
                                {unseenCount > 0 ? (
                                    <Badge badgeContent={unseenCount} color="secondary">
                                        <NotificationsIcon />
                                    </Badge>
                                ) : (
                                    <NotificationsIcon />
                                )}
                            </IconButton>
                            <ButtonBase
                                aria-haspopup="true"
                                onClick={this.handleProfileOpen}
                                className="ml-1 border-round">
                                <Avatar src={currentUser.photo} text={currentUser.username} />
                            </ButtonBase>
                        </div>
                    </Toolbar>
                    {showLoading && <LinearProgress color="secondary" className="pos-absolute app-bar-loading" />}
                </AppBar>
                <MainAppDrawer open={isDrawerOpen} onOpen={this.handleDrawerOpen} onClose={this.handleDrawerClose} />
                <MainAppNoti open={isNotiOpen} onClose={this.handleNotiClose} anchorEl={anchorNoti} />
                <MainAppProfile open={isProfileOpen} onClose={this.handleProfileClose} anchorEl={anchorProfile} />
                <MainAppGroup open={isGroupOpen} onClose={this.handleGroupClose} anchorEl={anchorGroup} />
            </div>
        );
    }
}

const mapStateToProps = (state) => ({
    app: state.app,
    auth: state.auth,
    group: state.group,
    user: state.user
});

export default connect(
    mapStateToProps,
    { fetchNotifications, getAllVirtual, seenNotifications, getSettings }
)(MainAppBar);
