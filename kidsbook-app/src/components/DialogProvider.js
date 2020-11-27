// React
import React, { Component } from 'react';

// Material UI
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@material-ui/core';

// Project
import DialogHelper from '../utils/DialogHelper';

class DialogProvider extends Component {
    state = {
        title: '',
        children: null,
        content: null,
        body: '',
        actions: null,
        props: {},
        onExit: null,
        _open: false
    };

    componentDidMount() {
        DialogHelper.init({
            show: (options) => {
                const newState = {
                    title: options.title,
                    children: options.children,
                    content: options.content,
                    body: options.body,
                    actions: options.actions,
                    props: options.props,
                    onExit: options.onExit,
                    _open: true
                };

                if (!newState.props) newState.props = {};
                this.setState(newState);
            },
            dismiss: () => {
                this.handleClose();
            }
        });
    }

    handleClose = () => {
        this.setState({
            _open: false
        });
        if (this.state.onExit) this.state.onExit();
    };

    defaultAction = (
        <Button onClick={this.handleClose} color="primary">
            OK
        </Button>
    );

    render() {
        const { title, content, body, actions, props, _open } = this.state;
        let { children } = this.state;

        if (!children) {
            children = (
                <>
                    <DialogTitle id="dialog-title">{title}</DialogTitle>
                    <DialogContent>
                        {content ? content : <DialogContentText id="dialog-description">{body}</DialogContentText>}
                    </DialogContent>
                    {actions ? (
                        <DialogActions>{actions}</DialogActions>
                    ) : (
                        <DialogActions>{this.defaultAction}</DialogActions>
                    )}
                </>
            );
        }

        return (
            <Dialog
                open={_open}
                onClose={this.handleClose}
                aria-labelledby="dialog-title"
                aria-describedby="dialog-description"
                PaperProps={{
                    className: 'dialog-normal outline-none'
                }}
                {...props}>
                {children}
            </Dialog>
        );
    }
}

export default DialogProvider;
