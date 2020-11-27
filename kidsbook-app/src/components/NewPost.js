// React
import React, { Component } from 'react';
import { connect } from 'react-redux';
import YouTube from 'react-youtube';

// Material UI
import {
    Button,
    CardMedia,
    Divider,
    FormControlLabel,
    IconButton,
    InputBase,
    Menu,
    MenuItem,
    Paper,
    Switch,
    Typography
} from '@material-ui/core';
import { Add as AddIcon, Close as CloseIcon, InsertLink as InsertLinkIcon, Send as SendIcon } from '@material-ui/icons';

// Project
import AnchorLink from '../components/AnchorLink';
import FormLink from '../utils/FormLink';
import FormYoutube from '../utils/FormYoutube';
import LoadingHelper from '../utils/LoadingHelper';
import { CREATE_POST } from '../actions/';
import { createPost } from '../actions/postActions';
import { parseYoutube } from '../utils/utils';
import { UserFormatter } from '../utils/formatter';
import { showOffensiveDialog, showAbnormalDialog, isAllCaps } from '../utils/CyberWellness';

class NewPost extends Component {
    state = {
        anchorMedia: null,
        newPostContent: '',
        newPostSystem: false,
        newPostMedia: null,
        newPostPayload: null,
        newPostPreview: null,
        newPostProcessing: false,
        newPostError: null
    };

    static getDerivedStateFromProps(nextProps, prevState) {
        const isProcessing = Boolean(nextProps.loading[CREATE_POST]);
        const isError = Boolean(nextProps.error[CREATE_POST]);
        const newState = {};

        if (isError !== prevState.newPostError) {
            newState.newPostError = isError;
        }

        // Transition from processing to not processing
        if (isProcessing !== prevState.newPostProcessing) {
            newState.newPostProcessing = isProcessing;
            // Don't clear if not success
            if (!isProcessing && prevState.newPostProcessing) {
                LoadingHelper.hide();
                if (!isError) {
                    newState.newPostContent = '';
                    newState.newPostSystem = false;
                    newState.newPostMedia = null;
                    newState.newPostPayload = null;
                }
            }
        }

        return {
            ...prevState,
            ...newState
        };
    }

    handleMediaMenuOpen = (ev) => {
        this.setState({ anchorMedia: ev.currentTarget });
    };

    handleMediaMenuClose = () => {
        this.setState({ anchorMedia: null });
    };

    handleMediaMenuLink = () => {
        this.handleMediaMenuClose();
        FormLink.show((res) => {
            if (!res) return;
            this.setState({ newPostMedia: 'link', newPostPayload: res });
        });
    };

    handleMediaMenuYoutube = () => {
        this.handleMediaMenuClose();
        FormYoutube.show((res) => {
            if (!res) return;
            this.setState({ newPostMedia: 'youtube', newPostPayload: res, newPostPreview: parseYoutube(res) });
        });
    };

    handleMediaPhotoChange = ({ target }) => {
        if (target && target.files && target.files[0]) {
            this.setState({
                newPostMedia: 'photo',
                newPostPayload: target.files[0],
                newPostPreview: URL.createObjectURL(target.files[0])
            });
        }
    };

    handleMediaPhotoLink = () => {
        let { newPostMedia, newPostPayload } = this.state;

        if (newPostMedia !== 'photo' && newPostMedia !== 'photo_link') {
            return;
        }

        if (newPostMedia === 'photo') {
            newPostPayload = {
                photo: newPostPayload
            };
        }

        FormLink.show((res) => {
            if (!res) return;
            this.setState({
                newPostMedia: 'photo_link',
                newPostPayload: {
                    ...newPostPayload,
                    link: res
                }
            });
        });
    };

    handleMediaRemove = () => {
        this.setState({
            newPostMedia: null,
            newPostPayload: null,
            newPostPreview: null
        });
    };

    handleOnPostChange = ({ target }) => {
        this.setState({
            newPostContent: target.value
        });
    };

    handlePostAsSystem = ({ target }) => {
        this.setState({
            newPostSystem: target.checked
        });
    };

    handleCreatePost = async () => {
        const { app } = this.props;
        const groupId = app.groupId;
        const { newPostContent, newPostMedia, newPostPayload, newPostSystem } = this.state;

        if (newPostContent.trim().length <= 0) return;

        const create = async (confirmProfanity) => {
            LoadingHelper.show('Creating your post');
            const response = await this.props.createPost(
                groupId,
                newPostContent,
                newPostMedia,
                newPostPayload,
                newPostSystem,
                confirmProfanity
            );
            if (response && response.needProfanityConfirm) {
                const isConfirm = await showOffensiveDialog();
                if (isConfirm) create(true);
            }
        };

        if (isAllCaps(newPostContent)) {
            const isConfirm = await showAbnormalDialog();
            if (isConfirm) create(true);
        } else {
            create(false);
        }
    };

    render() {
        const { anchorMedia, newPostContent, newPostSystem, newPostMedia, newPostPayload, newPostPreview } = this.state;
        const { auth, user } = this.props;
        const { isSuperuser } = UserFormatter.show(user[auth.realUser]);

        return (
            <>
                <Paper className="mb-3">
                    <InputBase
                        className="post-create"
                        placeholder="What's on your mind?"
                        fullWidth
                        multiline
                        onChange={this.handleOnPostChange}
                        value={newPostContent}
                    />
                    <Divider />
                    {String(newPostMedia).startsWith('photo') && (
                        <CardMedia className="post-media" image={newPostPreview} />
                    )}
                    {newPostMedia === 'youtube' && (
                        <div className="pos-relative post-media">
                            <YouTube className="pos-absolute absolute-fit" videoId={newPostPreview} />
                        </div>
                    )}
                    {newPostMedia === 'link' && (
                        <>
                            <Typography color="primary" className="post-create-link break-word">
                                <AnchorLink href={newPostPayload}>{newPostPayload}</AnchorLink>
                            </Typography>
                            <Divider />
                        </>
                    )}
                    {newPostMedia === 'photo_link' && (
                        <>
                            <Typography color="primary" className="post-create-link break-word">
                                <AnchorLink href={newPostPayload.link}>{newPostPayload.link}</AnchorLink>
                            </Typography>
                            <Divider />
                        </>
                    )}
                    <div className="flex-display flex-align-center post-create-action">
                        {newPostMedia ? (
                            <IconButton onClick={this.handleMediaRemove}>
                                <CloseIcon />
                            </IconButton>
                        ) : (
                            <IconButton onClick={this.handleMediaMenuOpen}>
                                <AddIcon />
                            </IconButton>
                        )}
                        {String(newPostMedia).startsWith('photo') && (
                            <IconButton onClick={this.handleMediaPhotoLink}>
                                <InsertLinkIcon />
                            </IconButton>
                        )}
                        <div className="flex-grow" />
                        {isSuperuser && (
                            <FormControlLabel
                                control={
                                    <Switch
                                        color="primary"
                                        checked={newPostSystem}
                                        onChange={this.handlePostAsSystem}
                                    />
                                }
                                label={<Typography className="trans-2">Post as system</Typography>}
                                className="post-as-system"
                            />
                        )}
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={this.handleCreatePost}
                            disabled={newPostContent.trim().length <= 0}>
                            Post
                            <SendIcon className="ml-1" fontSize="small" />
                        </Button>
                    </div>
                </Paper>
                <Menu anchorEl={anchorMedia} open={Boolean(anchorMedia)} onClose={this.handleMediaMenuClose}>
                    <MenuItem onClick={this.handleMediaMenuClose} className="pos-relative">
                        <label htmlFor="post-photo" className="cursor-pointer pos-absolute absolute-fit" />
                        Photo
                    </MenuItem>
                    <MenuItem onClick={this.handleMediaMenuLink}>Link</MenuItem>
                    <MenuItem onClick={this.handleMediaMenuYoutube}>Youtube</MenuItem>
                </Menu>
                <input
                    accept="image/*"
                    id="post-photo"
                    multiple
                    type="file"
                    className="none-display"
                    onChange={this.handleMediaPhotoChange}
                />
            </>
        );
    }
}

// TODO: Find out which is needed
const mapStateToProps = (state) => ({
    app: state.app,
    auth: state.auth,
    error: state.error,
    loading: state.loading,
    user: state.user
});

export default connect(
    mapStateToProps,
    { createPost }
)(NewPost);
