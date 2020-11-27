// React
import React, { Component } from 'react';
import { connect } from 'react-redux';

// Material UI
import {
    Button,
    Checkbox,
    Dialog,
    DialogContent,
    DialogContentText,
    DialogTitle,
    FormControlLabel
} from '@material-ui/core';

// Project
import SnackBarHelper from '../utils/SnackBarHelper';
import LoadingHelper from '../utils/LoadingHelper';
import { updateAction } from '../actions/pushActionActions';
import isObject from 'is-object';

class QuickfixDialogTNCProvider extends Component {
    state = {
        checked: true,
        learnMore: false,
        learnTime: 0,
        actionId: null,
        _open: false
    };

    static getDerivedStateFromProps(nextProps, prevState) {
        const nextGroup = nextProps.app.groupId;
        let tncId = null;

        const { pushAction } = nextProps;
        Object.keys(pushAction).forEach((actionId) => {
            const action = pushAction[actionId];
            const { groupId, payload, isProcessed } = action;
            if (nextGroup !== groupId || isProcessed || !isObject(payload) || !payload.tnc) return;
            tncId = actionId;
        });
        const newState = {};

        if (tncId !== prevState.actionId) {
            newState.checked = true;
            newState.learnMore = false;
            newState.learnTime = 0;
            newState.actionId = tncId;
            newState._open = Boolean(tncId);
        }

        return {
            ...prevState,
            ...newState
        };
    }

    handleClose = async () => {
        const { updateAction } = this.props;
        const { checked, learnMore, learnTime, actionId } = this.state;
        let totalTime = 0;

        if (learnMore) {
            totalTime = ((Date.now() - learnTime) / 1000).toFixed(3);
        }

        LoadingHelper.show('Processing...');
        const isSuccess = await updateAction(
            actionId,
            {
                checked: checked,
                totalTime: totalTime
            },
            true
        );
        LoadingHelper.hide();

        if (!isSuccess) {
            SnackBarHelper.enqueueSnackbar('Failed to submit');
        }
    };

    handleLearnMore = () => {
        this.setState({
            learnMore: true,
            learnTime: Date.now()
        });
    };

    handleCheckboxChange = () => {
        this.setState((state) => {
            return { checked: !state.checked };
        });
    };

    render() {
        const { checked, learnMore, _open } = this.state;

        if (learnMore) {
            return (
                <Dialog
                    open={_open}
                    onClose={this.handleClose}
                    aria-labelledby="dialog-title"
                    aria-describedby="dialog-description"
                    scroll="paper"
                    disableBackdropClick={true}
                    disableEscapeKeyDown={true}>
                    <DialogTitle id="dialog-title">Terms and Conditions of Use</DialogTitle>
                    <DialogContent>
                        <DialogContentText id="dialog-description" className="text-justify font-small">
                            <p>
                                <b>General</b>
                            </p>
                            <p>
                                ClassBuzz is owned and operated by the NUS School of Computing & MOE Experimental
                                Systems & Technology Laboratory (hereinafter “NUS & MOE”).
                            </p>
                            <p>
                                By accessing and using any part of ClassBuzz, you unconditionally agree and accept to be
                                legally bound by these Terms and Conditions of Use. If you do not agree to these Terms
                                and Conditions of Use, please do not use this platform.
                            </p>
                            <p>
                                In case of any violation of these Terms and Conditions of Use, NUS & MOE reserves the
                                right to seek all remedies available under the law and in equity for such violations.
                                These Terms and Conditions of Use apply to all visits to this website, both now and in
                                the future.
                            </p>
                            <p>
                                NUS & MOE reserves the right to change these Terms and Conditions of Use from time to
                                time at its sole discretion. The latest change in Terms & Conditions requires ClassBuzz
                                to share all your personal information with any third party apps that tap on ClassBuzz.
                                Your use of ClassBuzz after this change has been posted will constitute your agreement
                                to the modified Terms and Conditions of Use.
                            </p>
                        </DialogContentText>
                        <div className="flex-display flex-column flex-align-center pt-2">
                            <FormControlLabel
                                control={
                                    <Checkbox checked={checked} onChange={this.handleCheckboxChange} color="primary" />
                                }
                                label="I consent to Classbuzz sharing all personal information with any third party apps that is linked to Classbuzz."
                                className="mb-2"
                            />
                            <Button onClick={this.handleClose} color="primary" size="large" variant="contained">
                                Continue
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
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
                disableBackdropClick={true}
                disableEscapeKeyDown={true}>
                <DialogTitle id="dialog-title">Terms and Conditions has changed</DialogTitle>
                <DialogContent>
                    <DialogContentText id="dialog-description">
                        The update includes information about mobile safety, login security, and the use of your
                        information in ads and other contexts.
                    </DialogContentText>
                    <div className="flex-display flex-column flex-align-center pt-2">
                        <Button onClick={this.handleLearnMore} color="primary" size="small" className="mb-1">
                            Learn more
                        </Button>
                        <Button onClick={this.handleClose} color="primary" size="large" variant="contained">
                            I agree to the changes
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }
}

const mapStateToProps = (state) => ({
    app: state.app,
    pushAction: state.pushAction
});

export default connect(
    mapStateToProps,
    { updateAction }
)(QuickfixDialogTNCProvider);
