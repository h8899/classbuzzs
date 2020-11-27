// React
import React, { Component } from 'react';
import { connect } from 'react-redux';

// Material UI
import {
    AppBar,
    Button,
    Dialog,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    Slide,
    TextField,
    Toolbar,
    Typography
} from '@material-ui/core';
import { Close as CloseIcon } from '@material-ui/icons';

// Project
import MaterialTable from './MaterialTable';
import { createUser, importUsers, updateUser, getAllInAny } from '../actions/userActions';
import { getAllMembers, addUsersToGroup } from '../actions/groupActions';
import LoadingHelper from '../utils/LoadingHelper';
import SnackBarHelper from '../utils/SnackBarHelper';
import FormSelectGroup from '../utils/FormSelectGroup';
import {
    CREATE_USER,
    IMPORT_USERS,
    UPDATE_USER,
    ADD_USERS_TO_GROUP,
    GET_ALL_MEMBERS,
    GET_ALL_ANY_MEMBERS
} from '../actions/';
import { usernameOrEmail } from '../utils/quickfix';
import { GroupFormatter, UserFormatter } from '../utils/formatter';
import RouterLink from '../components/RouterLink';
import Avatar from '../components/Avatar';

const Roles = {
    0: 'Admin',
    1: 'Teacher',
    2: 'Student',
    3: 'Virtual'
};

// TODO: Make a component that handles all file uploads
class UsersTable extends Component {
    state = {
        activeGroup: null,
        showCreateDialog: false,
        showEditDialog: false,
        newUser: {
            type: 'USER',
            username: '',
            password: '',
            realname: '',
            email: ''
        },
        editUser: {
            id: '',
            username: '',
            password: '',
            email: '',
            description: ''
        },
        newProcessing: false,
        newError: false,
        importProcessing: false,
        importError: false,
        editProcessing: false,
        editError: false,
        joinProcessing: false,
        joinError: false
    };

    // TODO: Maybe there are better ways to do this?
    static getDerivedStateFromProps(nextProps, prevState) {
        const newProcessing = Boolean(nextProps.loading[CREATE_USER]);
        const newError = Boolean(nextProps.error[CREATE_USER]);
        const importProcessing = Boolean(nextProps.loading[IMPORT_USERS]);
        const importError = Boolean(nextProps.error[IMPORT_USERS]);
        const editProcessing = Boolean(nextProps.loading[UPDATE_USER]);
        const editError = Boolean(nextProps.error[UPDATE_USER]);
        const joinProcessing = Boolean(nextProps.loading[ADD_USERS_TO_GROUP]);
        const joinError = Boolean(nextProps.error[ADD_USERS_TO_GROUP]);
        const nextGroup = nextProps.groupId;
        const nextUser = nextProps.auth.realUser;
        const newState = {};

        const getNext = () => {
            if (nextProps.type === 'group') {
                nextProps.getAllMembers(nextGroup);
            } else {
                nextProps.getAllInAny(nextUser);
            }
        };

        if (newError !== prevState.newError) {
            newState.newError = newError;
        }
        if (importError !== prevState.importError) {
            newState.importError = importError;
        }
        if (editError !== prevState.editError) {
            newState.editError = editError;
        }
        if (joinError !== prevState.joinError) {
            newState.joinError = joinError;
        }

        // Transition from processing to not processing
        if (newProcessing !== prevState.newProcessing) {
            newState.newProcessing = newProcessing;

            if (!newProcessing && prevState.newProcessing) {
                LoadingHelper.hide();
                // Close dialog if success
                if (!newError) {
                    newState.showCreateDialog = false;
                    newState.newUser = {
                        type: 'USER',
                        username: '',
                        password: '',
                        realname: '',
                        email: ''
                    };
                    SnackBarHelper.enqueueSnackbar(`User ${prevState.newUser.username} created successfully`);
                    getNext();
                }
            }
        }
        if (importProcessing !== prevState.importProcessing) {
            newState.importProcessing = importProcessing;

            if (!importProcessing && prevState.importProcessing) {
                LoadingHelper.hide();
                // Close dialog if success
                if (!importError) {
                    SnackBarHelper.enqueueSnackbar(`Imported successfully`);
                    getNext();
                }
            }
        }
        if (editProcessing !== prevState.editProcessing) {
            newState.editProcessing = editProcessing;

            if (!editProcessing && prevState.editProcessing) {
                LoadingHelper.hide();
                // Close dialog if success
                if (!editError) {
                    newState.showEditDialog = false;
                    newState.editUser = {
                        id: '',
                        username: '',
                        password: '',
                        email: '',
                        description: ''
                    };
                    SnackBarHelper.enqueueSnackbar(`User ${prevState.editUser.username} modified successfully`);
                    getNext();
                }
            }
        }
        if (joinProcessing !== prevState.joinProcessing) {
            newState.joinProcessing = joinProcessing;

            if (!joinProcessing && prevState.joinProcessing) {
                LoadingHelper.hide();
                // Close dialog if success
                if (!joinError) {
                    SnackBarHelper.enqueueSnackbar(`Group joined successfully`);
                    getNext();
                }
            }
        }

        if (nextGroup !== prevState.activeGroup) {
            newState.activeGroup = nextGroup;
            getNext();
        }

        return {
            ...prevState,
            ...newState
        };
    }

    constructor(props) {
        super(props);
        this.importRef = React.createRef();
        this.sampleRef = React.createRef();
    }

    // TODO: Migrate to getDerivedStateFromProps
    /* componentDidMount() {
        const { type, groupId } = this.props;
        if (type === 'group') {
            this.props.getAllMembers(groupId);
        } else {
            // TODO: Get all users
        }
    } */

    handleCreateFieldChange = ({ target }) => {
        this.setState((state) => ({
            newUser: {
                ...state.newUser,
                [target.name]: target.value
            }
        }));
    };

    handleEditFieldChange = ({ target }) => {
        this.setState((state) => ({
            editUser: {
                ...state.editUser,
                [target.name]: target.value
            }
        }));
    };

    handleCreateUser = () => {
        const { type, username, password, realname, email } = this.state.newUser;
        const teacherId = type === 'USER' || type === 'VIRTUAL_USER' ? this.props.auth.realUser : null;

        LoadingHelper.show('Creating the user');
        this.props.createUser(type, username, password, realname, email, teacherId, this.props.groupId);
    };

    handleEditUser = () => {
        const user = this.state.editUser;
        const payload = {
            newDisplayName: user.username,
            newDescription: user.description,
            email: user.email
        };
        let isUpdatePassword = user.password.length > 0;

        if (isUpdatePassword) {
            payload.newPassword = user.password;
            payload.confirmPassword = user.password;
        }

        LoadingHelper.show('Modifying the user');
        this.props.updateUser(user.id, payload, isUpdatePassword, false);
    };

    handleOpenCreateDialog = () => {
        this.setState({
            showCreateDialog: true
        });
    };

    handleCloseCreateDialog = () => {
        this.setState({
            showCreateDialog: false
        });
    };

    handleOpenEditDialog = (user) => {
        this.setState({
            showEditDialog: true,
            editUser: {
                id: user.id,
                username: user.username,
                password: '',
                email: user.email,
                description: user.description
            }
        });
    };

    handleCloseEditDialog = () => {
        this.setState({
            showEditDialog: false
        });
    };

    handleCSVUploadBox = () => {
        this.importRef.current.click();
    };

    handleSampleDownload = () => {
        this.sampleRef.current.click();
    };

    handleOpenJoinDialog = (payload) => {
        FormSelectGroup.show((groupId) => {
            if (!groupId) return;
            this.handleBatchJoinGroup(payload, groupId);
        });
    };

    handleBatchJoinGroup = (payload, groupId) => {
        let userIds = payload;
        if (!Array.isArray(userIds)) userIds = [];
        LoadingHelper.show('Joining group');
        this.props.addUsersToGroup(userIds, groupId);
    };

    handleImportChange = ({ target }) => {
        if (target && target.files && target.files[0]) {
            LoadingHelper.show('Importing CSV file, this may take a while');
            const reader = new FileReader();
            reader.onload = async (e) => {
                const rawCSV = e.target.result;
                target.value = ''; // Reset so user can reupload the same filename
                this.props.importUsers(rawCSV, this.props.groupId);
            };
            reader.onerror = (error) => {
                LoadingHelper.hide();
                SnackBarHelper.enqueueSnackbar(error.message);
            };
            reader.readAsText(target.files[0]);
        }
    };

    handleTableAction = (action) => {
        switch (action.action) {
            case 'new':
                this.handleOpenCreateDialog();
                break;
            case 'edit': {
                const user = this.props.user[action.payload];
                if (user) {
                    this.handleOpenEditDialog(user);
                } else {
                    SnackBarHelper.enqueueSnackbar('Unable to modify the user');
                }
                break;
            }
            case 'import':
                this.handleCSVUploadBox();
                break;
            case 'sample':
                this.handleSampleDownload();
                break;
            case 'joinGroup': {
                this.handleOpenJoinDialog(action.payload);
                break;
            }
            default:
                return;
        }
    };

    render() {
        const { auth, group, loading, user, title, type, groupId } = this.props;
        const { showCreateDialog, showEditDialog, newUser } = this.state;

        const isLoading =
            type === 'group' ? loading[GET_ALL_MEMBERS][groupId] : loading[GET_ALL_ANY_MEMBERS][auth.realUser];

        const isValid = ['username', 'password', 'realname', 'email'].every(
            (k) => String(newUser[k]).trim().length > 0
        );

        const renderUser = (row) => (
            <RouterLink to={`/profile/${row.id}`}>
                <div className="flex-display flex-align-center">
                    <Avatar src={row.photo} text={row.username} className="mr-1" />
                    <Typography color="primary">{row.email}</Typography>
                </div>
            </RouterLink>
        );

        const fields = [
            { id: 'id', numeric: false, disablePadding: true, label: 'ID' },
            { id: 'email', numeric: false, disablePadding: false, label: usernameOrEmail, render: renderUser },
            { id: 'username', numeric: false, disablePadding: false, label: 'Display Name' },
            { id: 'realname', numeric: false, disablePadding: false, label: 'Full Name' },
            { id: 'role', numeric: false, disablePadding: false, label: 'Role' }
        ];

        let users = [];
        if (type === 'group') {
            users = GroupFormatter.show(group[groupId])
                .members.filter((m) => user[m])
                .map((m) => UserFormatter.show(user[m]));
        } else {
            users = UserFormatter.show(user[auth.realUser])
                ._children.filter((u) => user[u])
                .map((u) => UserFormatter.show(user[u]));
        }

        users = users.map((u) => ({
            ...u,
            role: Roles[u.role] || null,
            immutable: u.role <= 1,
            photo: u.photo
        }));

        return (
            <>
                <MaterialTable
                    title={title}
                    type={type}
                    fields={fields}
                    data={users}
                    sort={{
                        field: 'email',
                        order: 'asc'
                    }}
                    onAction={this.handleTableAction}
                    showLoading={isLoading}
                />
                <label htmlFor="users-import" ref={this.importRef} className="none-display" />
                <input
                    accept=".csv"
                    id="users-import"
                    multiple
                    type="file"
                    className="none-display"
                    onChange={this.handleImportChange}
                />
                <a
                    download="sample.csv"
                    href="data:text/csv;charset=UTF-8,username%2Cfullname%2Cpassword%0AALICE1234A%2CAlice%20Tan%2Calice%0AJOHND2345J%2CJohn%20Doe%2Cjohn"
                    className="none-display"
                    ref={this.sampleRef}
                />
                <Dialog
                    fullScreen
                    open={showCreateDialog}
                    onClose={this.handleCloseCreateDialog}
                    TransitionComponent={Slide}
                    TransitionProps={{ direction: 'up' }}>
                    <AppBar>
                        <Toolbar>
                            <IconButton
                                color="inherit"
                                onClick={this.handleCloseCreateDialog}
                                aria-label="Close"
                                className="app-bar-action">
                                <CloseIcon />
                            </IconButton>
                            <Typography variant="h6" color="inherit" align="left" noWrap>
                                New user
                            </Typography>
                            <div className="flex-grow" />
                            <Button color="inherit" onClick={this.handleCreateUser} disabled={!isValid}>
                                Create
                            </Button>
                        </Toolbar>
                    </AppBar>
                    <div className="pt-app-bar size-full pos-absolute absolute-top">
                        <div className="size-full overflow-y-auto users-create">
                            <div className="users-create-box">
                                <FormControl className="mb-3" fullWidth>
                                    <InputLabel htmlFor="type">Type</InputLabel>
                                    <Select
                                        value={this.state.newUser.type}
                                        onChange={this.handleCreateFieldChange}
                                        inputProps={{
                                            name: 'type',
                                            id: 'type'
                                        }}>
                                        <MenuItem value="SUPERUSER">Teacher</MenuItem>
                                        <MenuItem value="USER">Student</MenuItem>
                                        <MenuItem value="VIRTUAL_USER">Virtual Account</MenuItem>
                                    </Select>
                                </FormControl>
                                <TextField
                                    name="email"
                                    label={usernameOrEmail}
                                    value={this.state.newUser.email}
                                    onChange={this.handleCreateFieldChange}
                                    type="text"
                                    className="mb-3"
                                    fullWidth
                                />
                                <TextField
                                    name="username"
                                    label="Display Name"
                                    value={this.state.newUser.username}
                                    onChange={this.handleCreateFieldChange}
                                    className="mb-3"
                                    fullWidth
                                />
                                <TextField
                                    name="realname"
                                    label="Full Name"
                                    value={this.state.newUser.realname}
                                    onChange={this.handleCreateFieldChange}
                                    className="mb-3"
                                    fullWidth
                                />
                                <TextField
                                    name="password"
                                    label="Password"
                                    value={this.state.newUser.password}
                                    onChange={this.handleCreateFieldChange}
                                    type="password"
                                    className="mb-3"
                                    fullWidth
                                />
                            </div>
                        </div>
                    </div>
                </Dialog>
                <Dialog
                    fullScreen
                    open={showEditDialog}
                    onClose={this.handleCloseEditDialog}
                    TransitionComponent={Slide}
                    TransitionProps={{ direction: 'up' }}>
                    <AppBar>
                        <Toolbar>
                            <IconButton
                                color="inherit"
                                onClick={this.handleCloseEditDialog}
                                aria-label="Close"
                                className="app-bar-action">
                                <CloseIcon />
                            </IconButton>
                            <Typography variant="h6" color="inherit" align="left" noWrap>
                                Modify user
                            </Typography>
                            <div className="flex-grow" />
                            <Button
                                color="inherit"
                                onClick={this.handleEditUser}
                                disabled={String(this.state.editUser.username).trim().length <= 0}>
                                Save
                            </Button>
                        </Toolbar>
                    </AppBar>
                    <div className="pt-app-bar size-full pos-absolute absolute-top">
                        <div className="size-full overflow-y-auto users-create">
                            <div className="users-create-box">
                                <TextField
                                    name="username"
                                    label="Display Name"
                                    value={this.state.editUser.username}
                                    onChange={this.handleEditFieldChange}
                                    className="mb-3"
                                    fullWidth
                                />
                                <TextField
                                    name="password"
                                    label="Password"
                                    value={this.state.editUser.password}
                                    onChange={this.handleEditFieldChange}
                                    type="password"
                                    className="mb-3"
                                    fullWidth
                                />
                            </div>
                        </div>
                    </div>
                </Dialog>
            </>
        );
    }
}

const mapStateToProps = (state) => ({
    auth: state.auth,
    error: state.error,
    group: state.group,
    loading: state.loading,
    user: state.user
});

export default connect(
    mapStateToProps,
    { createUser, getAllMembers, importUsers, updateUser, getAllInAny, addUsersToGroup }
)(UsersTable);
