// React
import React, { Component } from 'react';
import isURL from 'validator/lib/isURL';

// Material UI
import { Button, DialogActions, DialogContent, DialogTitle, TextField } from '@material-ui/core';

// Project
import DialogHelper from './DialogHelper';

class FormLinkComponent extends Component {
    state = {
        url: '',
        valid: false
    };

    handleURLChange = ({ target }) => {
        const url = target.value;
        const valid = isURL(url);
        this.setState({ url, valid });
    };

    onExit = (cancel) => () => {
        DialogHelper.dismiss();
        if (cancel) {
            this.props.onExit(null);
        } else {
            this.props.onExit(this.state.url);
        }
    };

    render() {
        const { url, valid } = this.state;

        return (
            <>
                <DialogTitle id="dialog-title">Attach a link</DialogTitle>
                <DialogContent>
                    <TextField
                        margin="dense"
                        label="Link"
                        type="url"
                        fullWidth
                        value={url}
                        onChange={this.handleURLChange}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.onExit(true)}>Cancel</Button>
                    <Button onClick={this.onExit(false)} color="primary" disabled={!valid}>Attach</Button>
                </DialogActions>
            </>
        );
    }
}

class FormLink {
    static show(onExit) {
        if (!onExit) onExit = () => {};

        DialogHelper.showDialog({
            children: <FormLinkComponent onExit={onExit}/>,
            props: {
                disableBackdropClick: true,
                disableEscapeKeyDown: true
            }
        });
    }
}

export default FormLink;
