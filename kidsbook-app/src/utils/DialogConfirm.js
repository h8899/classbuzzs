// React
import React, { Component } from 'react';

// Material UI
import { Button, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@material-ui/core';

// Project
import DialogHelper from './DialogHelper';

class DialogConfirmComponent extends Component {
    onExit = (confirm) => () => {
        DialogHelper.dismiss();
        this.props.onExit(confirm);
    };

    render() {
        const { title, message } = this.props;

        return (
            <>
                <DialogTitle id="dialog-title">{title}</DialogTitle>
                <DialogContent>
                    <DialogContentText id="dialog-description">{message}</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.onExit(false)}>No</Button>
                    <Button onClick={this.onExit(true)} color="primary">
                        Yes
                    </Button>
                </DialogActions>
            </>
        );
    }
}

class DialogConfirm {
    static show(title, message, onExit) {
        if (!onExit) onExit = () => {};

        DialogHelper.showDialog({
            children: <DialogConfirmComponent title={title} message={message} onExit={onExit} />,
            props: {
                disableBackdropClick: true,
                disableEscapeKeyDown: true
            }
        });
    }
}

export default DialogConfirm;
