// React
import React, { Component } from 'react';
import { connect } from 'react-redux';

// Material UI
import {
    Badge,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    SwipeableDrawer,
    Typography
} from '@material-ui/core';
import {
    ViewStream as ViewStreamIcon,
    AccountCircle as AccountCircleIcon,
    Group as GroupIcon,
    Settings as SettingsIcon,
    PeopleOutline as PeopleOutlineIcon,
    SettingsApplications as SettingsApplicationsIcon,
    Domain as DomainIcon,
    BarChart as BarChartIcon,
    ExitToApp as ExitToAppIcon,
    Flag as FlagIcon,
    QuestionAnswer as QuestionAnswerIcon,
    Chat as ChatIcon
} from '@material-ui/icons';

// Project
import Navigation from '../navigation';
import { logoutUser } from '../actions/authActions';
import LoginBg from './LoginBg';
import logo from '../assets/logo.svg';

const iOS = process.browser && /iPad|iPhone|iPod/.test(navigator.userAgent);

class MainAppDrawer extends Component {
    handleLogout = () => {
        this.props.logoutUser();
    };

    drawerListUser = (hasGroups) => (
        <List>
            <ListItem button onClick={() => Navigation.pushAsync('/app')}>
                <ListItemIcon>
                    <ViewStreamIcon />
                </ListItemIcon>
                <ListItemText primary="Wall Feed" />
            </ListItem>
            <ListItem button onClick={() => Navigation.pushAsync('/profile')}>
                <ListItemIcon>
                    <AccountCircleIcon />
                </ListItemIcon>
                <ListItemText primary="My Profile" />
            </ListItem>
            <ListItem button onClick={() => Navigation.pushAsync('/groups')}>
                <ListItemIcon>
                    <GroupIcon />
                </ListItemIcon>
                <ListItemText primary="My Groups" />
            </ListItem>
            <ListItem button onClick={() => Navigation.pushAsync('/settings')}>
                <ListItemIcon>
                    <SettingsIcon />
                </ListItemIcon>
                <ListItemText primary="Settings" />
            </ListItem>
            {hasGroups && (
                <ListItem button onClick={() => Navigation.pushAsync('/games')}>
                    <ListItemIcon>
                        <ChatIcon />
                    </ListItemIcon>
                    <ListItemText primary="Games" />
                </ListItem>
            )}
        </List>
    );

    drawerListTeacher = (hasGroups) => (
        <List>
            {/* FIXME: Enable flag list feature */}
            {hasGroups && (
                <ListItem button onClick={() => Navigation.pushAsync('/flagged')}>
                    <ListItemIcon>
                        {/* TODO: Use dynamic flagged posts count */}
                        {/*<Badge badgeContent={3} color="secondary">*/}
                        <FlagIcon />
                        {/*</Badge>*/}
                    </ListItemIcon>
                    <ListItemText primary="Flagged posts" />
                </ListItem>
            )}
            {/* FIXME: Enable account feature */}
            <ListItem button onClick={() => Navigation.pushAsync('/accounts')} className="none-display">
                <ListItemIcon>
                    <PeopleOutlineIcon />
                </ListItemIcon>
                <ListItemText primary="Switch account" />
            </ListItem>
            {hasGroups && (
                <ListItem button onClick={() => Navigation.pushAsync('/groupsettings')}>
                    <ListItemIcon>
                        <SettingsApplicationsIcon />
                    </ListItemIcon>
                    <ListItemText primary="Group settings" />
                </ListItem>
            )}
            {hasGroups && (
                <ListItem button onClick={() => Navigation.pushAsync('/surveys')}>
                    <ListItemIcon>
                        <QuestionAnswerIcon />
                    </ListItemIcon>
                    <ListItemText primary="Group surveys" />
                </ListItem>
            )}
            <ListItem button onClick={() => Navigation.pushAsync('/management')}>
                <ListItemIcon>
                    <DomainIcon />
                </ListItemIcon>
                <ListItemText primary="Users management" />
            </ListItem>
            {/* FIXME: Enable analytics feature */}
            <ListItem button onClick={() => Navigation.pushAsync('/analytics')} className="none-display">
                <ListItemIcon>
                    <BarChartIcon />
                </ListItemIcon>
                <ListItemText primary="Analytics" />
            </ListItem>
        </List>
    );

    drawerListEnd = (
        <List>
            <ListItem button onClick={this.handleLogout}>
                <ListItemIcon>
                    <ExitToAppIcon />
                </ListItemIcon>
                <ListItemText primary="Log out" />
            </ListItem>
        </List>
    );

    render() {
        const { auth, user } = this.props;
        const currentUser = user[auth.realUser];
        const isSuperuser = currentUser && currentUser.isSuperuser;
        const hasGroups = currentUser && Array.isArray(currentUser.groups) && currentUser.groups.length > 0;

        return (
            <SwipeableDrawer
                disableBackdropTransition={!iOS}
                disableDiscovery={iOS}
                open={this.props.open}
                onClose={this.props.onClose}
                onOpen={this.props.onOpen}>
                <div tabIndex={0} role="button" onClick={this.props.onClose} onKeyDown={this.props.onClose}>
                    <div className="app-drawer-top pos-relative">
                        <div className="pos-absolute absolute-fit z-index-back">
                            <LoginBg />
                        </div>
                        <div className="pos-absolute absolute-fit flex-display flex-align-center flex-justify-center">
                            <div
                                className="app-drawer-logo img-contain mr-1"
                                style={{ backgroundImage: `url('${logo}')` }}
                            />
                            <Typography variant="h5" color="inherit">
                                Class
                                <b>Buzz</b>
                            </Typography>
                        </div>
                    </div>
                    {this.drawerListUser(hasGroups)}
                    <Divider />
                    {isSuperuser && (
                        <>
                            {this.drawerListTeacher(hasGroups)}
                            <Divider />
                        </>
                    )}
                    {this.drawerListEnd}
                </div>
            </SwipeableDrawer>
        );
    }
}

const mapStateToProps = (state) => ({
    auth: state.auth,
    user: state.user
});

export default connect(
    mapStateToProps,
    { logoutUser }
)(MainAppDrawer);
