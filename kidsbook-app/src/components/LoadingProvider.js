// React
import React, { Component } from 'react';

// Material UI
import { CircularProgress, Modal, Paper, Typography } from '@material-ui/core';

// Project
import LoadingHelper from '../utils/LoadingHelper';

class LoadingProvider extends Component {
    state = {
        message: '',
        _open: false
    };

    componentDidMount() {
        LoadingHelper.init({
            show: (message) => {
                this.setState({
                    message,
                    _open: true
                });
            },
            hide: () => {
                this.handleClose();
            }
        });
    }

    handleClose = () => {
        this.setState({
            _open: false
        });
    };

    render() {
        const { message, _open } = this.state;

        return (
            <Modal
                aria-labelledby="modal-loading-title"
                aria-describedby="modal-loading-message"
                open={_open}
                onClose={this.handleClose}
                disableBackdropClick
                disableEscapeKeyDown
                className="modal-loading flex-display flex-align-center flex-justify-center">
                <Paper className="modal-loading-paper outline-none">
                    <Typography variant="h6" id="modal-loading-title" className="mb-2">
                        Please wait...
                    </Typography>
                    <div className="flex-display flex-align-center">
                        <CircularProgress className="mr-2 flex-show" />
                        <Typography className="break-word" id="modal-loading-message">
                            {message}
                        </Typography>
                    </div>
                </Paper>
            </Modal>
        );
    }
}

export default LoadingProvider;
