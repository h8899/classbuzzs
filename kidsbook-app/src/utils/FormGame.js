// React
import React, { Component } from 'react';

// Material UI
import { Button, DialogActions, DialogContent, DialogTitle, TextField } from '@material-ui/core';

// Project
import DialogHelper from './DialogHelper';

class FormGameComponent extends Component {
    state = {
        title: ''
    };

    handleTitleChange = ({ target }) => {
        this.setState({
            title: target.value
        });
    };

    onExit = (result) => () => {
        DialogHelper.dismiss();
        if (this.props.callback) {
            this.props.callback(result);
        }
    };

    render() {
        const { title } = this.state;

        return (
            <>
                <DialogTitle id="dialog-title">Please specify a title for the game</DialogTitle>
                <DialogContent>
                    <TextField
                        margin="dense"
                        label="Game Title"
                        type="text"
                        fullWidth
                        value={title}
                        onChange={this.handleTitleChange}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.onExit(null)}>Cancel</Button>
                    <Button onClick={this.onExit(title)} color="primary" disabled={!title || title.length <= 0}>Create</Button>
                </DialogActions>
            </>
        );
    }
}

class FormGame {
    static show() {
        return new Promise((resolve) => {
            DialogHelper.showDialog({
                children: <FormGameComponent callback={resolve} />,
                props: {
                    disableBackdropClick: true,
                    disableEscapeKeyDown: true
                }
            });
        });
    }
}

export default FormGame;
