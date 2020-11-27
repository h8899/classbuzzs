// React
import React, { Component } from 'react';
import YouTube from 'react-youtube';

// Material UI
import { Button, DialogActions, DialogContent, DialogTitle, TextField } from '@material-ui/core';

// Project
import DialogHelper from './DialogHelper';
import { parseYoutube } from './utils';

class FormYoutubeComponent extends Component {
    state = {
        url: '',
        youtubeId: null
    };

    handleURLChange = ({ target }) => {
        const url = target.value;
        const youtubeId = parseYoutube(url);
        this.setState({ url, youtubeId });
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
        const { url, youtubeId } = this.state;

        return (
            <>
                <DialogTitle id="dialog-title">Attach a Youtube video</DialogTitle>
                <DialogContent>
                    {youtubeId && (
                        <div className="pos-relative dialog-youtube-media mb-2">
                            <YouTube className="pos-absolute absolute-fit" videoId={youtubeId} />
                        </div>
                    )}
                    <TextField
                        margin="dense"
                        label="Youtube Link"
                        type="text"
                        fullWidth
                        value={url}
                        onChange={this.handleURLChange}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.onExit(true)}>Cancel</Button>
                    <Button onClick={this.onExit(false)} color="primary" disabled={!youtubeId}>Attach</Button>
                </DialogActions>
            </>
        );
    }
}

class FormYoutube {
    static show(onExit) {
        if (!onExit) onExit = () => {};

        DialogHelper.showDialog({
            children: <FormYoutubeComponent onExit={onExit}/>,
            props: {
                disableBackdropClick: true,
                disableEscapeKeyDown: true
            }
        });
    }
}

export default FormYoutube;
