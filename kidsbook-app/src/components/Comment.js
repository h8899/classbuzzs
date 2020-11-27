// React
import React, { Component } from 'react';
import Moment from 'react-moment';
import { connect } from 'react-redux';
import Linkify from 'react-linkify';

// Material UI
import { Button, ButtonBase, Collapse, IconButton, Menu, MenuItem, Typography } from '@material-ui/core';
import {
    Flag as FlagIcon,
    MoreVert as MoreVertIcon,
    Reply as ReplyIcon,
    ThumbUp as ThumbUpIcon
} from '@material-ui/icons';

// Project
import RouterLink from './RouterLink';
import Avatar from './Avatar';
import LoadingHelper from '../utils/LoadingHelper';
import SnackBarHelper from '../utils/SnackBarHelper';
import DialogConfirm from '../utils/DialogConfirm';
import { createCommentLike, createCommentReport, deleteComment } from '../actions/commentActions';
import { CREATE_COMMENT_FLAG, DELETE_COMMENT } from '../actions/';
import { UserFormatter } from '../utils/formatter';

class Comment extends Component {
    state = {
        anchorMenu: null,
        activeUser: null,
        liked: null,
        flagged: null,
        flagProcessing: false,
        flagError: null,
        showDeleted: false,
        showOriginal: false,
        deleteProcessing: false,
        deleteError: null
    };

    static getDerivedStateFromProps(nextProps, prevState) {
        const flagProcessing = Boolean(nextProps.loading[CREATE_COMMENT_FLAG]);
        const flagError = Boolean(nextProps.error[CREATE_COMMENT_FLAG]);
        const deleteProcessing = Boolean(nextProps.loading[DELETE_COMMENT]);
        const deleteError = Boolean(nextProps.error[DELETE_COMMENT]);
        const nextUser = nextProps.auth.effectiveUser;
        const newState = {};

        if (flagError !== prevState.flagError) {
            newState.flagError = flagError;
        }
        if (deleteError !== prevState.deleteError) {
            newState.deleteError = deleteError;
        }

        if (flagProcessing !== prevState.flagProcessing) {
            newState.flagProcessing = flagProcessing;
            if (!flagProcessing && prevState.flagProcessing) {
                LoadingHelper.hide();
                if (!flagError) {
                    SnackBarHelper.enqueueSnackbar('Comment flagged successfully');
                }
            }
        }
        if (deleteProcessing !== prevState.deleteProcessing) {
            newState.deleteProcessing = deleteProcessing;
            if (!deleteProcessing && prevState.deleteProcessing) {
                LoadingHelper.hide();
                if (!deleteError) {
                    SnackBarHelper.enqueueSnackbar('Deleted successfully');
                }
            }
        }

        if (nextUser !== prevState.activeUser) {
            newState.activeUser = nextUser;
            const user = nextProps.user[nextUser];
            if (user && nextProps.comment) {
                let likes = nextProps.comment.likes;
                let flags = nextProps.comment.flags;
                if (!Array.isArray(likes)) likes = [];
                if (!Array.isArray(flags)) flags = [];
                newState.liked = null;
                newState.flagged = null;
                if (likes.indexOf(nextUser) >= 0) newState.liked = true;
                if (flags.indexOf(nextUser) >= 0) newState.flagged = true;
            }
        }

        if (prevState.liked === null) {
            if (nextProps.comment) {
                let likes = nextProps.comment.likes;
                if (!Array.isArray(likes)) likes = [];
                if (likes.indexOf(nextUser) >= 0) newState.liked = true;
            }
        }

        if (prevState.flagged === null) {
            if (nextProps.comment) {
                let flags = nextProps.comment.flags;
                if (!Array.isArray(flags)) flags = [];
                if (flags.indexOf(nextUser) >= 0) newState.flagged = true;
            }
        }

        return {
            ...prevState,
            ...newState
        };
    }

    handleLikeClick = () => {
        const liked = this.state.liked; // Attempt to prevent racing condition
        this.setState((state) => ({ liked: !state.liked }));
        this.props.createCommentLike(this.props.comment.id, !liked);
    };

    // TODO: Use actual data from backend, we just store it locally in state right now
    handleFlagClick = () => {
        if (this.state.flagged) {
            return SnackBarHelper.enqueueSnackbar('You had already flagged the comment');
        }
        DialogConfirm.show('Flag Comment', 'Are you sure you want to flag this comment for moderation?', (confirm) => {
            if (confirm) {
                LoadingHelper.show('Flagging the comment');
                this.setState({ flagged: true });
                this.props.createCommentReport(this.props.comment.id);
            }
        });
    };

    handleShowDeleted = () => {
        this.setState(({ showDeleted }) => ({ showDeleted: !showDeleted }));
    };

    handleMenuOpen = (ev) => {
        this.setState({
            anchorMenu: ev.currentTarget
        });
    };

    handleMenuClose = () => {
        this.setState({
            anchorMenu: null
        });
    };

    handleDeleteClick = () => {
        DialogConfirm.show('Delete comment', 'Are you sure you want to delete this comment?', (confirm) => {
            if (confirm) {
                this.props.deleteComment(this.props.comment.id);
                LoadingHelper.show('Deleting the comment');
            }
        });
        this.handleMenuClose();
    };

    handleFilterToggle = () => {
        this.setState((state) => ({ showOriginal: !state.showOriginal }));
        this.handleMenuClose();
    };

    render() {
        const { auth, user, comment, flagged } = this.props;
        const { activeUser, anchorMenu, showDeleted, showOriginal } = this.state;

        const isSuperuser = UserFormatter.show(user[auth.realUser]).isSuperuser;
        const isLiked = comment.likes.indexOf(activeUser) >= 0;
        const likeCount =
            comment.likes.length - Number(isLiked && !this.state.liked) + Number(!isLiked && this.state.liked);
        const isDeleted = comment.isDeleted;
        const canBeDeleted = !isDeleted && (isSuperuser || auth.realUser === comment.author.id);
        const canShowOriginal = isSuperuser && comment.original;

        if (isDeleted && !isSuperuser) return null;

        return (
            <div className="post-comment pos-relative">
                {flagged && (
                    <div className="pos-absolute post-flag">
                        <div id="flag-pos" className="pos-absolute post-flag-pos" />
                        <FlagIcon fontSize="inherit" color="inherit" />
                    </div>
                )}
                {
                    <RouterLink to={`/profile/${comment.author.id}`}>
                        <Avatar src={comment.author.photo} text={comment.author.username} />
                    </RouterLink>
                }
                <div className="post-comment-main">
                    <div className="post-comment-author">
                        <Typography color="primary" noWrap>
                            <RouterLink to={`/profile/${comment.author.id}`}>
                                <b>{comment.author.username}</b>
                            </RouterLink>
                        </Typography>
                        <Typography className="flex-show ml-1 trans-2">
                            <Moment fromNow locale="short" ago>
                                {comment.createdAt}
                            </Moment>
                        </Typography>
                    </div>
                    {isDeleted ? (
                        <>
                            <div className="flex-display flex-align-center trans-2">
                                <Typography className="font-smaller trans-2 line-compact mr-0-5">
                                    This comment has been deleted
                                </Typography>
                                <Button size="small" color="primary" onClick={this.handleShowDeleted}>
                                    {showDeleted ? 'Hide' : 'Show'}
                                </Button>
                            </div>
                            <Collapse in={showDeleted}>
                                <Typography component="p" className="mt-0-5">
                                    <Linkify properties={{ target: '_blank', className: 'color-secondary break-all' }}>
                                        {String(showOriginal ? comment.original : comment.body)
                                            .split('\n')
                                            .map((line, i) => {
                                                return (
                                                    <span key={i}>
                                                        {line}
                                                        <br />
                                                    </span>
                                                );
                                            })}
                                    </Linkify>
                                </Typography>
                            </Collapse>
                        </>
                    ) : (
                        <>
                            <Typography component="p" className="mt-0-5">
                                <Linkify properties={{ target: '_blank', className: 'color-secondary break-all' }}>
                                    {String(showOriginal ? comment.original : comment.body)
                                        .split('\n')
                                        .map((line, i) => {
                                            return (
                                                <span key={i}>
                                                    {line}
                                                    <br />
                                                </span>
                                            );
                                        })}
                                </Linkify>
                            </Typography>
                            <div className="flex-display mt-1">
                                <ButtonBase disableRipple className="mr-1" onClick={this.handleLikeClick}>
                                    <ThumbUpIcon
                                        fontSize="small"
                                        color={this.state.liked ? 'primary' : 'action'}
                                        className="mr-0-5"
                                    />
                                    {likeCount > 0 && (
                                        <Typography className="mr-0-5 font-smaller">{likeCount}</Typography>
                                    )}
                                </ButtonBase>
                                {/* FIXME: Allow replying to comment */}
                                {/*<ButtonBase disableRipple>
                            <ReplyIcon fontSize="small" color="action" />
                        </ButtonBase>*/}
                                <ButtonBase disableRipple onClick={this.handleFlagClick}>
                                    <FlagIcon fontSize="small" color="action" />
                                </ButtonBase>
                            </div>
                        </>
                    )}
                </div>
                {(canBeDeleted || canShowOriginal) && (
                    <IconButton onClick={this.handleMenuOpen}>
                        <MoreVertIcon />
                    </IconButton>
                )}
                <Menu anchorEl={anchorMenu} open={Boolean(anchorMenu)} onClose={this.handleMenuClose}>
                    {canBeDeleted && <MenuItem onClick={this.handleDeleteClick}>Delete</MenuItem>}
                    {canShowOriginal && (
                        <MenuItem onClick={this.handleFilterToggle}>{showOriginal ? 'Hide' : 'Show'} original</MenuItem>
                    )}
                </Menu>
            </div>
        );
    }
}

const mapStateToProps = (state) => ({
    auth: state.auth,
    error: state.error,
    loading: state.loading,
    user: state.user
});

export default connect(
    mapStateToProps,
    { createCommentLike, createCommentReport, deleteComment }
)(Comment);
