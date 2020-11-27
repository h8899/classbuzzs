// React
import React, { Component } from 'react';
import { connect } from 'react-redux';
import Moment from 'react-moment';

// Material UI
import {
    CircularProgress,
    IconButton,
    List,
    ListItem,
    ListItemText,
    Paper,
    Tooltip,
    Typography
} from '@material-ui/core';
import {
    ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon,
    Close as CloseIcon,
    Delete as DeleteIcon,
    Done as DoneIcon,
    Launch as LaunchIcon,
    ViewList as ViewListIcon
} from '@material-ui/icons';

// Project
import MainAppLayout from '../components/MainAppLayout';
import Post from '../components/Post';
import { getAllFlagged } from '../actions/groupActions';
import { fetchPosts, deletePost } from '../actions/postActions';
import { deleteComment } from '../actions/commentActions';
import { FlagFormatter, GroupFormatter, PostFormatter, CommentFormatter, UserFormatter } from '../utils/formatter';
import { GET_ALL_FLAGGED, FETCH_COMMENTS, DELETE_POST, DELETE_COMMENT } from '../actions/';
import Avatar from '../components/Avatar';
import LoadingHelper from '../utils/LoadingHelper';
import SnackBarHelper from '../utils/SnackBarHelper';
import DialogConfirm from '../utils/DialogConfirm';

class FlaggedPage extends Component {
    state = {
        activeGroup: null,
        activePost: null,
        index: -1,
        showList: false,
        getAllProcessing: false,
        getAllError: null,
        deleteProcessing: false,
        deleteError: null
    };

    static getDerivedStateFromProps(nextProps, prevState) {
        const nextGroup = nextProps.app.groupId;
        const getAllProcessing = Boolean(nextProps.loading[GET_ALL_FLAGGED]);
        const getAllError = Boolean(nextProps.error[GET_ALL_FLAGGED]);
        const deleteProcessing = Boolean(nextProps.loading[DELETE_POST] || nextProps.loading[DELETE_COMMENT]);
        const deleteError = Boolean(nextProps.error[DELETE_POST] || nextProps.error[DELETE_COMMENT]);
        const flagged = GroupFormatter.show(nextProps.group[nextGroup]).flagged.map((f) =>
            FlagFormatter.show(nextProps.flag[f])
        );
        const newState = {};

        if (getAllError !== prevState.getAllError) {
            newState.getAllError = getAllError;
        }
        if (deleteError !== prevState.deleteError) {
            newState.deleteError = deleteError;
        }

        // Transition from processing to not processing
        if (deleteProcessing !== prevState.deleteProcessing) {
            newState.deleteProcessing = deleteProcessing;

            if (!deleteProcessing && prevState.deleteProcessing) {
                LoadingHelper.hide();
                if (!deleteError) {
                    SnackBarHelper.enqueueSnackbar('Deleted successfully');
                }
            }
        }
        if (getAllProcessing !== prevState.getAllProcessing) {
            newState.getAllProcessing = getAllProcessing;

            if (!getAllProcessing && prevState.getAllProcessing && !getAllError) {
                if (flagged.length <= 0) {
                    newState.index = -1;
                    newState.activePost = null;
                } else {
                    newState.index = 0;
                    newState.activePost = flagged[0].post;
                }
            }
        }

        if (nextGroup !== prevState.activeGroup) {
            newState.activeGroup = nextGroup;
            if (nextGroup) {
                nextProps.fetchPosts(nextGroup, true);
                nextProps.getAllFlagged(nextGroup);
            }
        }

        return {
            ...prevState,
            ...newState
        };
    }

    handleListOpen = () => {
        this.setState({ showList: true });
    };

    handleListClose = () => {
        this.setState({ showList: false });
    };

    handleFlaggedSelect = (index) => () => {
        this.switchPost(index);
    };

    handleNextClick = () => {
        this.switchPost(this.state.index + 1);
    };

    handlePrevClick = () => {
        this.switchPost(this.state.index - 1);
    };

    handlePostDelete = (flag) => () => {
        DialogConfirm.show(`Delete ${flag.type}`, `Are you sure you want to delete this ${flag.type}?`, (confirm) => {
            if (confirm) {
                if (flag.type === 'post') {
                    this.props.deletePost(flag.post.id);
                } else {
                    this.props.deleteComment(flag.comment.id);
                }
                LoadingHelper.show(`Deleting the ${flag.type}`);
            }
        });
    };

    getGroupFlagged = () => {
        const { app, flag, group } = this.props;
        return GroupFormatter.show(group[app.groupId]).flagged.map((f) => FlagFormatter.show(flag[f]));
    };

    // TODO: Maybe there are better ways to do this?
    scrollToFlag = () => {
        const el = document.getElementById('flag-pos');
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;

        if (el) {
            let box = el.getBoundingClientRect();
            if (box && !isNaN(box.top) && !isNaN(scrollY)) {
                window.scrollTo(0, box.top + scrollY);
            }
        }
    };

    switchPost = (index) => {
        const flagged = this.getGroupFlagged();
        const newIndex = Math.min(flagged.length - 1, Math.max(0, index));
        const newPost = flagged[newIndex].post;

        this.setState((state) => {
            if (newIndex === state.index && newPost === state.activePost) return;
            return {
                index: newIndex,
                activePost: newPost
            };
        });
    };

    render() {
        const { index, showList, getAllProcessing } = this.state;
        const { app, auth, comment, flag, group, loading, post, user } = this.props;
        const currentUser = user[auth.realUser];

        const flagged = GroupFormatter.show(group[app.groupId]).flagged.map((f) => {
            f = FlagFormatter.show(flag[f]);
            f.post = PostFormatter.show(post[f.post]);
            f.comment = CommentFormatter.show(comment[f.comment]);
            f.post.author = UserFormatter.show(user[f.post.author]);
            f.comment.author = UserFormatter.show(user[f.comment.author]);
            return f;
        });

        const flagMain = flagged[index];
        const gotFlags = flagged.length > 0;
        const isValid = Boolean(flagMain);
        const isLoading = Boolean(getAllProcessing);
        
        let isDeleted = true;
        let isCommentLoading = false;

        const errorMessage =
            !currentUser || !currentUser.isSuperuser
                ? 'Access denied'
                : !gotFlags
                    ? 'No flagged post available'
                    : !isLoading && !isValid
                        ? 'Something went wrong'
                        : null;

        if (isValid && !errorMessage) {
            isDeleted = Boolean(flagMain[flagMain.type].isDeleted);
            isCommentLoading = Boolean(loading[FETCH_COMMENTS][flagMain.post.id]);

            flagMain.user = UserFormatter.show(user[flagMain.user]);
            const p = flagMain.post;
            p.group = GroupFormatter.show(group[p.groupId]);
            p.comments = p.comments.map((c) => {
                c = CommentFormatter.show(comment[c]);
                c.author = UserFormatter.show(user[c.author]);
                return c;
            });
            p.commentsPreview = p.commentsPreview.map((c) => {
                c = CommentFormatter.show(comment[c]);
                c.author = UserFormatter.show(user[c.author]);
                return c;
            });
            flagMain.post = p;
        }

        return (
            <MainAppLayout
                title="Flagged posts"
                showGroupSelector
                allowSwitchGroup
                showLoading={isLoading || isCommentLoading}
                errorMessage={errorMessage}>
                <div
                    className={`anim-slower page-flagged pb-3 ${showList ? 'is-split-mode' : ''} ${
                        isLoading ? 'none-display' : ''
                    }`}>
                    {flagMain && (
                        <Post
                            post={flagMain.post}
                            single
                            flagged={flagMain.type === 'post'}
                            flaggedComment={
                                flagMain.type === 'comment' && flagMain.comment ? flagMain.comment.id : null
                            }
                        />
                    )}
                    <Paper className="anim-slower flag-bar" elevation={2}>
                        {isValid && (
                            <div className="flag-bar-left">
                                <Avatar src={flagMain.user.photo} text={flagMain.user.username} />
                                <div className="ml-1 flex-display flex-column overflow-hidden">
                                    <div className="overflow-hidden flex-display flex-align-end">
                                        <Typography className="line-compact inline-display font-smallest mr-0-5">
                                            Reported by
                                        </Typography>
                                        <Typography noWrap color="primary" className="line-compact inline-display">
                                            <b>{flagMain.user.username}</b>
                                        </Typography>
                                    </div>
                                    <Typography noWrap className="font-smaller line-compact trans-2">
                                        <Moment fromNow locale="en">
                                            {flagMain.createdAt}
                                        </Moment>
                                    </Typography>
                                </div>
                            </div>
                        )}
                        <div className="flag-bar-center">
                            <Tooltip title="Previous issue" onClick={this.handlePrevClick}>
                                <IconButton>
                                    <ChevronLeftIcon />
                                </IconButton>
                            </Tooltip>
                            <Typography className="flex-show">
                                {index + 1}
                                <span className="flag-post-count trans-2 font-smaller"> / {flagged.length}</span>
                            </Typography>
                            <Tooltip title="Next issue" onClick={this.handleNextClick}>
                                <IconButton>
                                    <ChevronRightIcon />
                                </IconButton>
                            </Tooltip>
                        </div>
                        <div className="flag-bar-right">
                            {/* FIXME: Enable those feature */}
                            <Tooltip title="Open in new window" className="none-display">
                                <IconButton>
                                    <LaunchIcon />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete post / comment" className={!isValid ? 'none-display' : ''}>
                                <IconButton
                                    disabled={isDeleted}
                                    onClick={this.handlePostDelete(flagMain)}>
                                    <DeleteIcon />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Mark as resolved" className="none-display">
                                <IconButton>
                                    <DoneIcon />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Open list">
                                <IconButton onClick={this.handleListOpen}>
                                    <ViewListIcon />
                                </IconButton>
                            </Tooltip>
                        </div>
                    </Paper>
                    <Paper className="anim-slower pt-app-bar flag-list" elevation={3}>
                        <div className="size-full overflow-y-auto">
                            <List>
                                {flagged.map((f, i) => {
                                    let author;
                                    let body;

                                    if (f.type === 'comment' && f.comment) {
                                        author = f.comment.author;
                                        body = f.comment.body;
                                    } else {
                                        author = f.post.author;
                                        body = f.post.body;
                                    }

                                    return (
                                        <ListItem
                                            button
                                            key={i}
                                            onClick={this.handleFlaggedSelect(i)}
                                            selected={i === index}>
                                            <Typography className="mr-1">{i + 1}</Typography>
                                            <Avatar src={author.photo} text={author.username} />
                                            <ListItemText
                                                primary={author.username}
                                                primaryTypographyProps={{ className: 'line-pi', noWrap: true }}
                                                secondary={body}
                                                secondaryTypographyProps={{ className: 'line-compact', noWrap: true }}
                                            />
                                        </ListItem>
                                    );
                                })}
                            </List>
                        </div>
                        <div className="anim-slower flag-list-action">
                            <IconButton onClick={this.handleListClose}>
                                <CloseIcon />
                            </IconButton>
                        </div>
                    </Paper>
                </div>
                {isLoading ? (
                    <div className="size-full flex-display flex-align-center flex-justify-center mt-3">
                        <CircularProgress />
                    </div>
                ) : null}
            </MainAppLayout>
        );
    }
}

const mapStateToProps = (state) => ({
    app: state.app,
    auth: state.auth,
    comment: state.comment,
    error: state.error,
    flag: state.flag,
    group: state.group,
    loading: state.loading,
    post: state.post,
    user: state.user
});

export default connect(
    mapStateToProps,
    { fetchPosts, getAllFlagged, deletePost, deleteComment }
)(FlaggedPage);
