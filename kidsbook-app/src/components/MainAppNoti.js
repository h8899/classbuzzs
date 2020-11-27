// React
import React, { Component } from 'react';
import Moment from 'react-moment';
import { connect } from 'react-redux';

// Material UI
import {
    LinearProgress,
    List,
    ListItem,
    ListItemAvatar,
    ListItemSecondaryAction,
    ListItemText,
    Popover,
    Switch,
    Typography
} from '@material-ui/core';

// Project
import Config from '../config';
import Avatar from './Avatar';
import Navigation from '../navigation';
import { updateSettings } from '../actions/appActions';
import { NotificationFormatter, UserFormatter } from '../utils/formatter';
import { FETCH_NOTIFICATIONS } from '../actions/';
import { turnOnNotification, turnOffNotification } from '../serviceWorker';
import SnackBarHelper from '../utils/SnackBarHelper';
import LoadingHelper from '../utils/LoadingHelper';
import DialogConfirm from '../utils/DialogConfirm';

class MainAppNoti extends Component {
    state = {
        enabled: null
    };

    static getDerivedStateFromProps(nextProps, prevState) {
        const { notification } = nextProps.app;
        // TODO: Not a correct way to do it
        const receiveNoti = notification.globalEnabled && notification.enabled;
        const newState = {};

        if (Boolean(prevState.enabled) !== receiveNoti) {
            newState.enabled = receiveNoti;
        }

        return {
            ...prevState,
            ...newState
        };
    }

    handleToggleNotifications = () => {
        const enable = !this.state.enabled; // Attempt to prevent racing condition

        const next = async () => {
            LoadingHelper.show(`Turning notification ${enable ? 'on' : 'off'}`);
            try {
                if (enable) {
                    const settings = await turnOnNotification(Config.vapidPublic);
                    if (!settings) throw new Error('Notification failed to turn on');
                    const result = await this.props.updateSettings(settings); // settings = subscription
                    if (result.error) throw new Error(result.error);
                } else {
                    await turnOffNotification();
                    const result = await this.props.updateSettings(null);
                    if (result.error) throw new Error(result.error);
                }
                this.setState({ enabled: enable });
            } catch (e) {
                SnackBarHelper.enqueueSnackbar(String(e.message));
            }
            LoadingHelper.hide();
        };

        if (enable) {
            next();
        } else {
            DialogConfirm.show(
                'Turn off notifications',
                'Are you sure? This will turn off notifications for all devices',
                (confirm) => {
                    if (confirm) next();
                }
            );
        }
    };

    handleClickNoti = (n) => () => {
        if (n.post) {
            this.closeAndGotoURL(`/post/${n.post}`);
        } else if (n.group) {
            this.closeAndGotoURL('/groups');
        }
    };

    closeAndGotoURL = (url) => {
        this.props.onClose();
        Navigation.pushAsync(url);
    };

    getNotifications = () => {
        const { app, user } = this.props;
        const { notifications } = app.notification;

        const items = notifications.map((n) => {
            n = NotificationFormatter.show(n);
            n.user = UserFormatter.show(user[n.user]);

            return (
                <ListItem key={n.id} button onClick={this.handleClickNoti(n)}>
                    <ListItemAvatar>
                        <Avatar src={n.user.photo} text={n.user.username} />
                    </ListItemAvatar>
                    <ListItemText
                        primary={
                            <Typography variant="body2" className="line-pi">
                                {n.content}
                            </Typography>
                        }
                        secondary={
                            <Moment fromNow locale="short">
                                {n.createdAt}
                            </Moment>
                        }
                    />
                </ListItem>
            );
        });

        return items;
    };

    render() {
        const { loading } = this.props;
        const isLoading = loading[FETCH_NOTIFICATIONS];

        return (
            <Popover
                anchorEl={this.props.anchorEl}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                open={this.props.open}
                onClose={this.props.onClose}
                transitionDuration={200}
                className="app-noti">
                <List className="app-noti-list">
                    {isLoading && <LinearProgress color="secondary" className="pos-absolute width-full absolute-top" />}
                    <ListItem className="mb-2">
                        <ListItemText primary="Notifications" />
                        <ListItemSecondaryAction>
                            <Switch
                                color="secondary"
                                onChange={this.handleToggleNotifications}
                                checked={Boolean(this.state.enabled)}
                            />
                        </ListItemSecondaryAction>
                    </ListItem>
                    {this.getNotifications()}
                </List>
            </Popover>
        );
    }
}

const mapStateToProps = (state) => ({
    app: state.app,
    loading: state.loading,
    user: state.user
});

export default connect(
    mapStateToProps,
    { updateSettings }
)(MainAppNoti);
