// React
import React, { Component } from 'react';
import { connect } from 'react-redux';

// Material UI
import {
    Button,
    Divider,
    ExpansionPanel,
    ExpansionPanelActions,
    ExpansionPanelDetails,
    ExpansionPanelSummary,
    InputBase,
    TextField,
    Typography
} from '@material-ui/core';
import { ExpandMore as ExpandMoreIcon } from '@material-ui/icons';

// Project
import MainAppLayout from '../components/MainAppLayout';
import { UPDATE_USER } from '../actions/';
import SnackBarHelper from '../utils/SnackBarHelper';
import LoadingHelper from '../utils/LoadingHelper';
import { updateUser, getUser } from '../actions/userActions';
import { usernameOrEmail } from '../utils/quickfix';

class SettingsPage extends Component {
    state = {
        activeUser: null,
        expanded: null,
        newDisplayName: '',
        newDescription: '',
        oldPassword: '',
        newPassword: '',
        newPhoto: null,
        newPreview: '',
        email: '',
        confirmPassword: '',
        updateProcessing: false,
        updateError: false
    };

    static getDerivedStateFromProps(nextProps, prevState) {
        const nextUser = nextProps.auth.effectiveUser;
        const isProcessing = Boolean(nextProps.loading[UPDATE_USER]);
        const isError = Boolean(nextProps.error[UPDATE_USER]);
        const newState = {};

        if (isError !== prevState.updateError) {
            newState.updateError = isError;
        }

        // Transition from processing to not processing
        if (isProcessing !== prevState.updateProcessing) {
            newState.updateProcessing = isProcessing;

            if (!isProcessing && prevState.updateProcessing) {
                LoadingHelper.hide();
                // Close modal if success
                if (!isError) {
                    SnackBarHelper.enqueueSnackbar('User updated successfully');
                    nextProps.getUser(nextProps.auth.effectiveUser);
                }
            }
        }

        if (nextUser !== prevState.activeUser) {
            newState.activeUser = nextUser;
            const user = nextProps.user[nextUser];
            if (user) {
                newState.newDisplayName = user.username;
                newState.newDescription = user.description;
                newState.newPreview = user.photo || '';
                newState.email = user.email;
            }
        }

        return {
            ...prevState,
            ...newState
        };
    }

    handlePanelClose = () => {
        this.setState({
            expanded: null
        });
    };

    handlePanelToggle = (panel) => (event, expanded) => {
        this.setState({
            expanded: expanded ? panel : null
        });
    };

    onChangeDisplayName = ({ target }) => {
        this.setState({
            newDisplayName: target.value
        });
    };

    onChangeDescription = ({ target }) => {
        this.setState({
            newDescription: target.value
        });
    };

    onChangeOldPassword = ({ target }) => {
        this.setState({
            oldPassword: target.value
        });
    };

    onChangeNewPassword = ({ target }) => {
        this.setState({
            newPassword: target.value
        });
    };

    onChangeConfirmPassword = ({ target }) => {
        this.setState({
            confirmPassword: target.value
        });
    };

    // TODO: Try not to pass the whole this.state in the future
    updateInfo = () => {
        LoadingHelper.show('Updating user');
        this.props.updateUser(this.props.auth.effectiveUser, this.state, false, false);
    };

    updatePassword = () => {
        LoadingHelper.show('Updating user password');
        this.props.updateUser(this.props.auth.effectiveUser, this.state, true, false);
    };

    updatePhoto = () => {
        if (this.state.newPhoto) {
            LoadingHelper.show('Updating user photo');
            this.props.updateUser(this.props.auth.effectiveUser, this.state, false, true);
        }
    };

    handlePhotoChange = ({ target }) => {
        if (target && target.files && target.files[0]) {
            this.setState({
                newPhoto: target.files[0],
                newPreview: URL.createObjectURL(target.files[0])
            });
        }
    };

    // TODO: Migrate to getDerivedStateFromProps
    /* componentDidMount() {
        const user = this.props.user[this.props.auth.effectiveUser];
        this.setState({
            newDisplayName: user.username,
            newDescription: user.description,
            newPreview: user.photo || '',
            email: user.email
        });
    } */

    render() {
        const { activeUser, expanded, newDisplayName, newDescription, newPreview } = this.state;
        const user = this.props.user[activeUser];

        return (
            <MainAppLayout title="Settings">
                <div className="page-settings">
                    <ExpansionPanel expanded={expanded === 'email'} onChange={this.handlePanelToggle('email')}>
                        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography className="setting-title">{usernameOrEmail}</Typography>
                            <Typography className="trans-2 ml-1">{user.email}</Typography>
                        </ExpansionPanelSummary>
                        <ExpansionPanelDetails>
                            <Typography>You are not allowed to change your {usernameOrEmail.toLowerCase()}</Typography>
                        </ExpansionPanelDetails>
                    </ExpansionPanel>
                    <ExpansionPanel
                        expanded={expanded === 'display-name'}
                        onChange={this.handlePanelToggle('display-name')}>
                        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography className="setting-title">Display Name</Typography>
                            <Typography className="trans-2 ml-1">{user.username}</Typography>
                        </ExpansionPanelSummary>
                        <Divider />
                        <ExpansionPanelDetails className="block-display">
                            <Typography align="center" className="mt-2">
                                <b>Change your display name</b>
                            </Typography>
                            <div className="setting-form">
                                <TextField
                                    label="Display Name"
                                    variant="outlined"
                                    onChange={this.onChangeDisplayName}
                                    value={newDisplayName}
                                    fullWidth
                                    className="mt-2"
                                />
                            </div>
                        </ExpansionPanelDetails>
                        <Divider />
                        <ExpansionPanelActions>
                            <Button size="small" variant="outlined" onClick={this.handlePanelClose}>
                                Cancel
                            </Button>
                            <Button
                                size="small"
                                variant="outlined"
                                onClick={this.updateInfo}
                                color="primary"
                                disabled={String(newDisplayName).trim().length <= 0}>
                                Save
                            </Button>
                        </ExpansionPanelActions>
                    </ExpansionPanel>
                    <ExpansionPanel expanded={expanded === 'full-name'} onChange={this.handlePanelToggle('full-name')}>
                        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography className="setting-title">Full Name</Typography>
                            <Typography className="trans-2 ml-1">{user.realname}</Typography>
                        </ExpansionPanelSummary>
                        <ExpansionPanelDetails>
                            <Typography>You are not allowed to change your full name</Typography>
                        </ExpansionPanelDetails>
                    </ExpansionPanel>
                    <ExpansionPanel expanded={expanded === 'password'} onChange={this.handlePanelToggle('password')}>
                        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography className="setting-title">Password</Typography>
                            <Typography className="trans-2 ml-1">********</Typography>
                        </ExpansionPanelSummary>
                        <Divider />
                        <ExpansionPanelDetails className="block-display">
                            <Typography align="center" className="mt-2">
                                <b>Change your password</b>
                            </Typography>
                            <div className="setting-form">
                                <TextField
                                    label="Current password"
                                    variant="outlined"
                                    type="password"
                                    onChange={this.onChangeOldPassword}
                                    fullWidth
                                    className="mt-2"
                                />
                                <TextField
                                    label="New password"
                                    variant="outlined"
                                    type="password"
                                    onChange={this.onChangeNewPassword}
                                    fullWidth
                                    className="mt-2"
                                />
                                <TextField
                                    label="Confirm password"
                                    variant="outlined"
                                    type="password"
                                    onChange={this.onChangeConfirmPassword}
                                    fullWidth
                                    className="mt-2"
                                />
                            </div>
                        </ExpansionPanelDetails>
                        <Divider />
                        <ExpansionPanelActions>
                            <Button size="small" variant="outlined" onClick={this.handlePanelClose}>
                                Cancel
                            </Button>
                            <Button size="small" variant="outlined" onClick={this.updatePassword} color="primary">
                                Save
                            </Button>
                        </ExpansionPanelActions>
                    </ExpansionPanel>
                    <ExpansionPanel
                        expanded={expanded === 'profile-picture'}
                        onChange={this.handlePanelToggle('profile-picture')}>
                        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography className="setting-title">Profile picture</Typography>
                            <Typography className="trans-2 ml-1">Change your profile picture</Typography>
                        </ExpansionPanelSummary>
                        <Divider />
                        <ExpansionPanelDetails className="flex-column flex-align-center">
                            <div
                                className="setting-photo img-fit mb-2"
                                style={{ backgroundImage: `url('${newPreview}')` }}
                            />
                            <Button variant="contained" color="primary" className="pos-relative">
                                <label htmlFor="user-photo" className="cursor-pointer pos-absolute absolute-fit" />
                                Upload photo
                            </Button>
                            <input
                                accept="image/*"
                                id="user-photo"
                                multiple
                                type="file"
                                className="none-display"
                                onChange={this.handlePhotoChange}
                            />
                        </ExpansionPanelDetails>
                        <Divider />
                        <ExpansionPanelActions>
                            <Button size="small" variant="outlined" onClick={this.handlePanelClose}>
                                Cancel
                            </Button>
                            <Button size="small" variant="outlined" onClick={this.updatePhoto} color="primary">
                                Save
                            </Button>
                        </ExpansionPanelActions>
                    </ExpansionPanel>
                    <ExpansionPanel
                        className="mb-2"
                        expanded={expanded === 'about-me'}
                        onChange={this.handlePanelToggle('about-me')}>
                        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography className="setting-title">About me</Typography>
                            <Typography className="trans-2 ml-1">Edit what others see about you</Typography>
                        </ExpansionPanelSummary>
                        <Divider />
                        <InputBase
                            placeholder="About me"
                            fullWidth
                            multiline
                            className="setting-about"
                            onChange={this.onChangeDescription}
                            value={newDescription}
                        />
                        <Divider />
                        <ExpansionPanelActions>
                            <Button size="small" variant="outlined" onClick={this.handlePanelClose}>
                                Cancel
                            </Button>
                            <Button size="small" variant="outlined" onClick={this.updateInfo} color="primary">
                                Save
                            </Button>
                        </ExpansionPanelActions>
                    </ExpansionPanel>
                </div>
            </MainAppLayout>
        );
    }
}

const mapStateToProps = (state) => ({
    auth: state.auth,
    error: state.error,
    loading: state.loading,
    user: state.user
});

export default connect(
    mapStateToProps,
    { updateUser, getUser }
)(SettingsPage);
