// React
import React, { Component } from 'react';
import { connect } from 'react-redux';
import isObject from 'is-object';

// Material UI
import {
    Button,
    CircularProgress,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    InputLabel,
    MenuItem,
    Select
} from '@material-ui/core';
import { ArrowDropDown as ArrowDropDownIcon } from '@material-ui/icons';

// Project
import DialogHelper from './DialogHelper';
import { getUser } from '../actions/userActions';
import { GET_USER } from '../actions/';

class DropDownProgress extends Component {
    render() {
        return <CircularProgress size={20} {...this.props} />;
    }
}

class _FormSelectGroupComponent extends Component {
    state = {
        groupId: ''
    };

    componentDidMount() {
        this.props.getUser(this.props.auth.realUser);
    }

    handleSelectChange = ({ target }) => {
        this.setState({ groupId: target.value });
    };

    onExit = (cancel) => () => {
        DialogHelper.dismiss();
        if (cancel) {
            this.props.onExit(null);
        } else {
            this.props.onExit(this.state.groupId);
        }
    };

    render() {
        const { auth, group, loading, user } = this.props;
        const { groupId } = this.state;

        const u = user[auth.realUser];
        const groups = (isObject(u) && Array.isArray(u.groups) ? u.groups : [])
            .map((g) => group[g])
            .filter((g) => isObject(g));
        const isLoading = loading[GET_USER][auth.realUser];

        return (
            <>
                <DialogTitle id="dialog-title">Join a group</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth>
                        <InputLabel htmlFor="group-join">Group</InputLabel>
                        <Select
                            value={groupId}
                            onChange={this.handleSelectChange}
                            IconComponent={isLoading ? DropDownProgress : ArrowDropDownIcon}
                            inputProps={{
                                name: 'group-join',
                                id: 'group-join'
                            }}>
                            {groups.map((g) => (
                                <MenuItem key={g.id} value={g.id}>
                                    {g.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.onExit(true)}>Cancel</Button>
                    <Button onClick={this.onExit(false)} color="primary" disabled={!groupId}>
                        Join
                    </Button>
                </DialogActions>
            </>
        );
    }
}

const mapStateToProps = (state) => ({
    auth: state.auth,
    group: state.group,
    loading: state.loading,
    user: state.user
});

const FormSelectGroupComponent = connect(
    mapStateToProps,
    { getUser }
)(_FormSelectGroupComponent);

class FormSelectGroup {
    static show(onExit) {
        if (!onExit) onExit = () => {};

        DialogHelper.showDialog({
            children: <FormSelectGroupComponent onExit={onExit} />,
            props: {
                disableBackdropClick: true,
                disableEscapeKeyDown: true
            }
        });
    }
}

export default FormSelectGroup;
