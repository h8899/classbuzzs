// React
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { saveAs } from 'file-saver';

// Material UI
import {
    Button,
    Divider,
    ExpansionPanel,
    ExpansionPanelActions,
    ExpansionPanelDetails,
    ExpansionPanelSummary,
    InputBase,
    List,
    ListItem,
    ListItemIcon,
    ListItemSecondaryAction,
    ListItemText,
    Switch,
    TextField,
    Typography
} from '@material-ui/core';
import {
    ExpandMore as ExpandMoreIcon,
    Link as LinkIcon,
    OndemandVideo as OndemandVideoIcon,
    Photo as PhotoIcon,
    Textsms as TextsmsIcon,
    ThumbUp as ThumbUpIcon
} from '@material-ui/icons';

// Project
import MainAppLayout from '../components/MainAppLayout';
import UsersTable from '../components/UsersTable';
import { UPDATE_GROUP } from '../actions/';
import { updateGroup } from '../actions/groupActions';
import { pushNewAction } from '../actions/pushActionActions';
import LoadingHelper from '../utils/LoadingHelper';
import SnackBarHelper from '../utils/SnackBarHelper';
import { GroupFormatter, UserFormatter } from '../utils/formatter';
import { ExtensionAPI } from '../apis/';
import { quickFixTncConvert } from '../utils/CSVConverter';

class GroupSettingsPage extends Component {
    state = {
        activeGroup: null,
        expanded: null,
        advanced: {
            'text-filtering': true,
            likes: true,
            photo: true,
            youtube: true,
            link: true
        },
        newName: '',
        newDescription: '',
        newPhoto: null,
        newPreview: '',
        updateProcessing: false,
        updateError: false
    };

    static getDerivedStateFromProps(nextProps, prevState) {
        const nextGroup = nextProps.app.groupId;
        const isProcessing = Boolean(nextProps.loading[UPDATE_GROUP]);
        const isError = Boolean(nextProps.error[UPDATE_GROUP]);
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
                    SnackBarHelper.enqueueSnackbar('Group updated successfully');
                }
            }
        }

        if (nextGroup !== prevState.activeGroup) {
            newState.activeGroup = nextGroup;
            const group = nextProps.group[nextGroup];
            if (group) {
                newState.newName = group.name;
                newState.newDescription = group.description;
                newState.newPreview = group.photo || '';
            }
        }

        return {
            ...prevState,
            ...newState
        };
    }

    handleAdvancedToggle = (key) => () => {
        const { advanced } = this.state;
        const newAdvanced = Object.assign({}, advanced, { [key]: !advanced[key] });

        this.setState({
            advanced: newAdvanced
        });
    };

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

    onChangeName = ({ target }) => {
        this.setState({
            newName: target.value
        });
    };

    onChangeDescription = ({ target }) => {
        this.setState({
            newDescription: target.value
        });
    };

    updateInfo = () => {
        LoadingHelper.show('Updating group');
        this.props.updateGroup(this.state.activeGroup, this.state, false);
    };

    updatePhoto = () => {
        if (this.state.newPhoto) {
            LoadingHelper.show('Updating group photo');
            this.props.updateGroup(this.state.activeGroup, this.state, true);
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

    handleShowTnc = async () => {
        const { activeGroup } = this.state;
        LoadingHelper.show('Showing the T&C prompt...');
        await this.props.pushNewAction(activeGroup, { tnc: true });
        LoadingHelper.hide();
    };

    handleDownloadTnc = async () => {
        const { user } = this.props;
        const { activeGroup } = this.state;
        LoadingHelper.show('Generating CSV file...');
        try {
            const responses = await ExtensionAPI.getAllGroupActionResponses(activeGroup);
            const csv = await quickFixTncConvert(user, responses);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
            saveAs(blob, 'tnc.csv');
        } catch (e) {
            SnackBarHelper.enqueueSnackbar('CSV fails to generate');
        }
        LoadingHelper.hide();
    };

    // TODO: Migrate to getDerivedStateFromProps
    /* componentDidMount() {
        const group = this.props.group[this.props.app.groupId] || {};
        this.setState({
            newName: group.name,
            newDescription: group.description
        });
    } */

    // TODO: Use param groupId instead
    render() {
        const { activeGroup, expanded, advanced, newName, newDescription, newPreview } = this.state;
        const { auth, user } = this.props;

        const group = GroupFormatter.show(this.props.group[activeGroup]);
        const currentUser = UserFormatter.show(user[auth.realUser]);

        let errorMessage = null;
        if (!activeGroup) errorMessage = 'Something went wrong';
        if (!currentUser || !currentUser.isSuperuser) errorMessage = 'Access denied';

        return (
            <MainAppLayout title="Group Settings" showGroupSelector allowSwitchGroup errorMessage={errorMessage}>
                <div className="page-group-settings pb-3">
                    <ExpansionPanel expanded={expanded === 'name'} onChange={this.handlePanelToggle('name')}>
                        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography className="setting-title">Group name</Typography>
                            <Typography className="trans-2 ml-1">{group.name}</Typography>
                        </ExpansionPanelSummary>
                        <Divider />
                        <ExpansionPanelDetails className="block-display">
                            <Typography align="center" className="mt-2">
                                <b>Change the group name</b>
                            </Typography>
                            <div className="setting-form">
                                <TextField
                                    label="Group name"
                                    variant="outlined"
                                    onChange={this.onChangeName}
                                    value={newName}
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
                                disabled={String(newName).trim().length <= 0}>
                                Save
                            </Button>
                        </ExpansionPanelActions>
                    </ExpansionPanel>
                    <ExpansionPanel expanded={expanded === 'members'} onChange={this.handlePanelToggle('members')}>
                        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography className="setting-title">Group members</Typography>
                            <Typography className="trans-2 ml-1">Manage group members</Typography>
                        </ExpansionPanelSummary>
                        <Divider />
                        <UsersTable title="Members list" type="group" groupId={group.id} />
                    </ExpansionPanel>
                    <ExpansionPanel
                        expanded={expanded === 'description'}
                        onChange={this.handlePanelToggle('description')}>
                        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography className="setting-title">Group description</Typography>
                            <Typography className="trans-2 ml-1">{group.description}</Typography>
                        </ExpansionPanelSummary>
                        <Divider />
                        <InputBase
                            placeholder="Group description"
                            fullWidth
                            multiline
                            className="group-setting-desc"
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
                    <ExpansionPanel expanded={expanded === 'photo'} onChange={this.handlePanelToggle('photo')}>
                        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography className="setting-title">Group photo</Typography>
                            <Typography className="trans-2 ml-1">Change the group photo</Typography>
                        </ExpansionPanelSummary>
                        <Divider />
                        <ExpansionPanelDetails className="flex-column flex-align-center">
                            <div
                                className="group-setting-photo img-fit mb-2"
                                style={{ backgroundImage: `url('${newPreview}')` }}
                            />
                            <Button variant="contained" color="primary" className="pos-relative">
                                <label htmlFor="group-photo" className="cursor-pointer pos-absolute absolute-fit" />
                                Upload photo
                            </Button>
                            <input
                                accept="image/*"
                                id="group-photo"
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
                    <ExpansionPanel expanded={expanded === 'features'} onChange={this.handlePanelToggle('features')}>
                        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography className="setting-title">Additional features</Typography>
                        </ExpansionPanelSummary>
                        <Divider />
                        <ExpansionPanelDetails className="flex-column flex-align-center">
                            <div>
                                <Button variant="contained" color="primary" className="pos-relative" onClick={this.handleShowTnc}>
                                    Show T&C prompt
                                </Button>
                            </div>
                            <div>
                                <Button variant="contained" color="primary" className="pos-relative mt-2" onClick={this.handleDownloadTnc}>
                                    Download T&C responses as CSV
                                </Button>
                            </div>
                        </ExpansionPanelDetails>
                    </ExpansionPanel>
                    {/* FIXME: Enable advanced features */}
                    <ExpansionPanel
                        expanded={expanded === 'advanced'}
                        onChange={this.handlePanelToggle('advanced')}
                        className="none-display">
                        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography className="setting-title">Advanced settings</Typography>
                            <Typography className="trans-2" />
                        </ExpansionPanelSummary>
                        <ExpansionPanelDetails className="block-display">
                            <List>
                                <ListItem>
                                    <ListItemIcon>
                                        <TextsmsIcon />
                                    </ListItemIcon>
                                    <ListItemText primary="Text filtering" />
                                    <ListItemSecondaryAction>
                                        <Switch
                                            color="primary"
                                            onChange={this.handleAdvancedToggle('text-filtering')}
                                            checked={advanced['text-filtering'] === true}
                                        />
                                    </ListItemSecondaryAction>
                                </ListItem>
                                <ListItem>
                                    <ListItemIcon>
                                        <ThumbUpIcon />
                                    </ListItemIcon>
                                    <ListItemText primary="Likes" />
                                    <ListItemSecondaryAction>
                                        <Switch
                                            color="primary"
                                            onChange={this.handleAdvancedToggle('likes')}
                                            checked={advanced['likes'] === true}
                                        />
                                    </ListItemSecondaryAction>
                                </ListItem>
                                <ListItem>
                                    <ListItemIcon>
                                        <PhotoIcon />
                                    </ListItemIcon>
                                    <ListItemText primary="Photo" />
                                    <ListItemSecondaryAction>
                                        <Switch
                                            color="primary"
                                            onChange={this.handleAdvancedToggle('photo')}
                                            checked={advanced['photo'] === true}
                                        />
                                    </ListItemSecondaryAction>
                                </ListItem>
                                <ListItem>
                                    <ListItemIcon>
                                        <OndemandVideoIcon />
                                    </ListItemIcon>
                                    <ListItemText primary="Youtube" />
                                    <ListItemSecondaryAction>
                                        <Switch
                                            color="primary"
                                            onChange={this.handleAdvancedToggle('youtube')}
                                            checked={advanced['youtube'] === true}
                                        />
                                    </ListItemSecondaryAction>
                                </ListItem>
                                <ListItem>
                                    <ListItemIcon>
                                        <LinkIcon />
                                    </ListItemIcon>
                                    <ListItemText primary="Link" />
                                    <ListItemSecondaryAction>
                                        <Switch
                                            color="primary"
                                            onChange={this.handleAdvancedToggle('link')}
                                            checked={advanced['link'] === true}
                                        />
                                    </ListItemSecondaryAction>
                                </ListItem>
                            </List>
                        </ExpansionPanelDetails>
                        <ExpansionPanelActions>
                            <Button size="small" variant="outlined" onClick={this.handlePanelClose}>
                                Cancel
                            </Button>
                            <Button size="small" variant="outlined" onClick={this.handlePanelClose} color="primary">
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
    app: state.app,
    auth: state.auth,
    error: state.error,
    group: state.group,
    loading: state.loading,
    user: state.user
});

export default connect(
    mapStateToProps,
    { updateGroup, pushNewAction }
)(GroupSettingsPage);
