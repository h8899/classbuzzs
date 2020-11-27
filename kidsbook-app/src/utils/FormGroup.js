// React
import React, { Component } from 'react';
import { connect } from 'react-redux';

// Material UI
import { Button, DialogActions, DialogContent, DialogTitle, TextField } from '@material-ui/core';

// Project
import SnackBarHelper from './SnackBarHelper';
import DialogHelper from './DialogHelper';
import LoadingHelper from './LoadingHelper';
import { CREATE_GROUP } from '../actions/';
import { createGroup } from '../actions/groupActions';
import { getUser } from '../actions/userActions';

class _FormGroupComponent extends Component {
    state = {
        name: '',
        createProcessing: false,
        createError: null
    };
    
    static getDerivedStateFromProps(nextProps, prevState) {
        const isProcessing = Boolean(nextProps.loading[CREATE_GROUP]);
        const isError = Boolean(nextProps.error[CREATE_GROUP]);
        const newState = {};

        if (isError !== prevState.createError) {
            newState.createError = isError;
        }

        // Transition from processing to not processing
        if (isProcessing !== prevState.createProcessing) {
            newState.createProcessing = isProcessing;

            if (!isProcessing && prevState.createProcessing) {
                LoadingHelper.hide();
                // Close modal if success
                if (!isError) {
                    DialogHelper.dismiss();
                    SnackBarHelper.enqueueSnackbar(`Group ${prevState.name} created successfully`);
                    nextProps.getUser(nextProps.auth.realUser);
                }
            }
        }

        return {
            ...prevState,
            ...newState
        };
    }

    handleNameChange = ({ target }) => {
        this.setState({
            name: target.value
        });
    };

    onCreate = () => {
        LoadingHelper.show('Creating your group');
        this.props.createGroup(this.state.name);
    };

    onCancel = () => {
        DialogHelper.dismiss();
    };

    render() {
        const { name } = this.state;

        return (
            <>
                <DialogTitle id="dialog-title">Create a new group</DialogTitle>
                <DialogContent>
                    <TextField
                        margin="dense"
                        label="Group Name"
                        type="text"
                        fullWidth
                        value={name}
                        onChange={this.handleNameChange}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.onCancel}>Cancel</Button>
                    <Button onClick={this.onCreate} color="primary" disabled={!name || name.length <= 0}>Create</Button>
                </DialogActions>
            </>
        );
    }
}

const mapStateToProps = (state) => ({
    auth: state.auth,
    error: state.error,
    loading: state.loading
});

const FormGroupComponent = connect(
    mapStateToProps,
    { createGroup, getUser }
)(_FormGroupComponent);

class FormGroup {
    static show() {
        DialogHelper.showDialog({
            children: <FormGroupComponent />,
            props: {
                disableBackdropClick: true,
                disableEscapeKeyDown: true
            }
        });
    }
}

export default FormGroup;
