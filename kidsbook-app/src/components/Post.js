// React
import React from 'react';
import LazyYoutube from './LazyYoutube';
import Moment from 'react-moment';
import { connect } from 'react-redux';
import Linkify from 'react-linkify';
import deepEqual from 'deep-equal';

// Material UI
import {
    Button,
    ButtonBase,
    Card,
    CardActions,
    CardContent,
    CardHeader,
    CardMedia,
    CircularProgress,
    Collapse,
    Divider,
    IconButton,
    Menu,
    MenuItem,
    TextField,
    Tooltip,
    Typography
} from '@material-ui/core';
import {
    Delete as DeleteIcon,
    ThumbUp as ThumbUpIcon,
    Comment as CommentIcon,
    Flag as FlagIcon,
    ExpandMore as ExpandMoreIcon,
    MoreVert as MoreVertIcon,
    Close as CloseIcon,
    Send as SendIcon
} from '@material-ui/icons';

// Project
import Comment from './Comment';
import RouterLink from './RouterLink';
import Avatar from './Avatar';
import LoadingHelper from '../utils/LoadingHelper';
import SnackBarHelper from '../utils/SnackBarHelper';
import LightBoxHelper from '../utils/LightBoxHelper';
import DialogConfirm from '../utils/DialogConfirm';
import Navigation from '../navigation';
import { getAllComments, createComment } from '../actions/commentActions';
import { createLike, createReport, deletePost, updatePost } from '../actions/postActions';
import { CREATE_COMMENT, CREATE_FLAG, FETCH_COMMENTS, DELETE_POST } from '../actions/';
import { UserFormatter } from '../utils/formatter';

// TODO: Loading state when commenting
class Post extends React.Component {
    constructor(props) {
        super(props);
        this.commentsRef = React.createRef();
    }

    state = {
        anchorMenu: null,
        activeUser: null,
        activePost: null,
        expanded: false,
        showDeleted: false,
        showOriginal: false,
        liked: null,
        flagged: null,
        newComment: false,
        newCommentContent: '',
        newCommentProcessing: false,
        newCommentError: null,
        flagProcessing: false,
        flagError: null,
        commentsProcessing: false,
        commentsError: null,
        deleteProcessing: false,
        deleteError: null,
        postLastUpdated: null
    };

    shouldComponentUpdate(nextProps, nextState) {
        if (!deepEqual(this.state, nextState)) {
            return true;
        }
        return false;
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        const isProcessing = Boolean(nextProps.loading[CREATE_COMMENT][nextProps.post.id]);
        const isError = Boolean(nextProps.error[CREATE_COMMENT][nextProps.post.id]);
        const flagProcessing = Boolean(nextProps.loading[CREATE_FLAG]);
        const flagError = Boolean(nextProps.error[CREATE_FLAG]);
        const commentsProcessing = Boolean(nextProps.loading[FETCH_COMMENTS][nextProps.post.id]);
        const commentsError = Boolean(nextProps.error[FETCH_COMMENTS][nextProps.post.id]);
        const deleteProcessing = Boolean(nextProps.loading[DELETE_POST]);
        const deleteError = Boolean(nextProps.error[DELETE_POST]);
        const nextUser = nextProps.auth.effectiveUser;
        const nextPost = nextProps.post.id;
        const isSuperuser = UserFormatter.show(nextProps.user[nextProps.auth.realUser]).isSuperuser;
        const newState = {};

        if (isError !== prevState.newCommentError) {
            newState.newCommentError = isError;
        }
        if (flagError !== prevState.flagError) {
            newState.flagError = flagError;
        }
        if (commentsError !== prevState.commentsError) {
            newState.commentsError = commentsError;
        }
        if (deleteError !== prevState.deleteError) {
            newState.deleteError = deleteError;
        }

        // Transition from processing to not processing
        if (isProcessing !== prevState.newCommentProcessing) {
            newState.newCommentProcessing = isProcessing;
            // Don't clear if not success
            if (!isProcessing && prevState.newCommentProcessing) {
                LoadingHelper.hide();
                if (!isError) {
                    SnackBarHelper.enqueueSnackbar('Comment posted successfully');
                    newState.newComment = false;
                    newState.newCommentContent = '';
                    newState.expanded = true;
                    if (nextPost) nextProps.getAllComments(nextPost, isSuperuser);
                    if (prevState.__scrollToBottom) prevState.__scrollToBottom();
                }
            }
        }
        if (flagProcessing !== prevState.flagProcessing) {
            newState.flagProcessing = flagProcessing;
            if (!flagProcessing && prevState.flagProcessing) {
                LoadingHelper.hide();
                if (!flagError) {
                    SnackBarHelper.enqueueSnackbar('Post flagged successfully');
                }
            }
        }
        if (commentsProcessing !== prevState.commentsProcessing) {
            newState.commentsProcessing = commentsProcessing;
            if (!commentsProcessing && prevState.commentsProcessing) {
                if (commentsError) {
                    SnackBarHelper.enqueueSnackbar('Failed to load comments');
                } else {
                    newState.expanded = true;
                    if (prevState.__scrollToBottom) prevState.__scrollToBottom();
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
            if (user && nextProps.post) {
                let likes = nextProps.post.likes;
                let flags = nextProps.post.flags;
                if (!Array.isArray(likes)) likes = [];
                if (!Array.isArray(flags)) flags = [];
                newState.liked = null;
                newState.flagged = null;
                if (likes.indexOf(nextUser) >= 0) newState.liked = true;
                if (flags.indexOf(nextUser) >= 0) newState.flagged = true;
            }
        }

        if (nextPost !== prevState.activePost) {
            newState.activePost = nextPost;
            if (nextProps.single && nextPost) {
                nextProps.getAllComments(nextPost, isSuperuser);
            }
        }

        if (prevState.liked === null) {
            if (nextProps.post) {
                let likes = nextProps.post.likes;
                if (!Array.isArray(likes)) likes = [];
                if (likes.indexOf(nextUser) >= 0) newState.liked = true;
            }
        }

        if (prevState.flagged === null) {
            if (nextProps.post) {
                let flags = nextProps.post.flags;
                if (!Array.isArray(flags)) flags = [];
                if (flags.indexOf(nextUser) >= 0) newState.flagged = true;
            }
        }

        if (prevState.postLastUpdated !== nextProps.post._lastUpdated) {
            newState.postLastUpdated = nextProps.post._lastUpdated;
        }

        return {
            ...prevState,
            ...newState
        };
    }

    componentDidMount() {
        this.setState({
            __scrollToBottom: this.scrollToBottom
        });
    }

    scrollToBottom = () => {
        setTimeout(() => {
            if (this.commentsRef && this.commentsRef.current) {
                this.commentsRef.current.scrollTop = this.commentsRef.current.scrollHeight;
            }
        }, 1);
    };

    handleMediaClick = () => {
        window.open(this.props.post.payload.url, '_blank');
    };

    handleExpandClick = () => {
        if (this.state.expanded) {
            this.setState({ expanded: false });
        } else {
            const isSuperuser = UserFormatter.show(this.props.user[this.props.auth.realUser]).isSuperuser;
            if (this.props.post.id) this.props.getAllComments(this.props.post.id, isSuperuser);
        }
    };

    handleCloseNewComment = () => {
        this.setState({
            newComment: false,
            newCommentContent: ''
        });
    };

    handleOpenNewComment = () => {
        this.setState({ newComment: true });
    };

    handleLikeClick = () => {
        const liked = this.state.liked; // Attempt to prevent racing condition
        this.setState((state) => ({ liked: !state.liked }));
        this.props.createLike(this.props.post.id, !liked);
    };

    // TODO: Use actual data from backend, we just store it locally in state right now
    handleFlagClick = () => {
        if (this.state.flagged) {
            return SnackBarHelper.enqueueSnackbar('You had already flagged the post');
        }
        DialogConfirm.show('Flag Post', 'Are you sure you want to flag this post for moderation?', (confirm) => {
            if (confirm) {
                LoadingHelper.show('Flagging the post');
                this.setState({ flagged: true });
                this.props.createReport(this.props.post.id);
            }
        });
    };

    handleShowDeleted = () => {
        this.setState(({ showDeleted }) => ({ showDeleted: !showDeleted }));
    };

    onChangeComment = ({ target }) => {
        this.setState({
            newCommentContent: target.value
        });
    };

    handleCreateComment = (e) => {
        e.preventDefault();
        if (this.state.newCommentContent.trim().length <= 0) return;
        LoadingHelper.show('Posting your comment');
        this.props.createComment(this.props.post.id, this.state.newCommentContent);
    };

    showLightBox = (src) => () => {
        LightBoxHelper.show(src);
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
        DialogConfirm.show('Delete post', 'Are you sure you want to delete this post?', (confirm) => {
            if (confirm) {
                this.props.deletePost(this.props.post.id);
                LoadingHelper.show('Deleting the post');
            }
        });
        this.handleMenuClose();
    };

    handleFilterToggle = () => {
        this.setState((state) => ({ showOriginal: !state.showOriginal }));
        this.handleMenuClose();
    };

    handleRandomToggle = async () => {
        const { post, updatePost } = this.props;
        const postId = post.id;
        const isRandom = post.isRandom;

        this.handleMenuClose();
        LoadingHelper.show(`${isRandom ? 'Disabling' : 'Enabling'} random...`);
        await updatePost(postId, !isRandom);
        LoadingHelper.hide();
    };

    handlePinToggle = async () => {
        const { post, updatePost } = this.props;
        const postId = post.id;
        const isAnnouncement = post.isAnnouncement;

        this.handleMenuClose();
        LoadingHelper.show(`${isAnnouncement ? 'Unpinning from' : 'Pinning to'} top...`);
        await updatePost(postId, null, !isAnnouncement);
        LoadingHelper.hide();
    };

    // TODO: post is the post passed in from
    // TODO: Don't pass down comments in post.comment in the future version, code below can be further optimized
    render() {
        const {
            anchorMenu,
            newComment,
            newCommentContent,
            commentsProcessing,
            showDeleted,
            showOriginal,
            activeUser
        } = this.state;
        const { auth, user, post, single, flagged, flaggedComment } = this.props;

        const isSuperuser = UserFormatter.show(user[auth.realUser]).isSuperuser;
        const isLiked = post.likes.indexOf(activeUser) >= 0;
        const likeCount =
            post.likes.length - Number(isLiked && !this.state.liked) + Number(!isLiked && this.state.liked);
        const isDeleted = post.isDeleted;
        const isSystem = post.isSystem;
        const canBeDeleted = !isDeleted && (isSuperuser || auth.realUser === post.author.id);
        const canShowOriginal = isSuperuser && post.original;
        const canSetRandom = isSuperuser && post.isSystem;
        const canPinToTop = isSuperuser;

        if (isDeleted && !isSuperuser) return null;

        const newCommentBox = (
            <form
                noValidate
                autoComplete="off"
                onSubmit={this.handleCreateComment}
                className="post-new-comment pos-absolute absolute-fit flex-display">
                <IconButton aria-label="Close comment" onClick={this.handleCloseNewComment}>
                    <CloseIcon />
                </IconButton>
                <TextField
                    autoFocus
                    placeholder="Add a comment"
                    margin="none"
                    className="flex-grow ml-1 mr-1"
                    onChange={this.onChangeComment}
                    value={newCommentContent}
                />
                <IconButton aria-label="Add comment" type="submit" disabled={newCommentContent.trim().length <= 0}>
                    <SendIcon />
                </IconButton>
            </form>
        );

        const mainPost = (
            <>
                {(post.isAnnouncement || (post.isRandom && isSuperuser)) && (
                    <div className={`post-highlight-${post.isAnnouncement ? 'pinned' : 'random'}`} />
                )}
                <CardHeader
                    avatar={
                        !isSystem && (
                            <RouterLink to={`/profile/${post.author.id}`}>
                                <Avatar src={post.author.photo} text={post.author.username} />
                            </RouterLink>
                        )
                    }
                    action={
                        (canBeDeleted || canShowOriginal) && (
                            <IconButton onClick={this.handleMenuOpen}>
                                <MoreVertIcon />
                            </IconButton>
                        )
                    }
                    title={
                        !isSystem && (
                            <RouterLink to={`/profile/${post.author.id}`}>
                                <Typography color="primary">
                                    <b>{post.author.username}</b>
                                </Typography>
                            </RouterLink>
                        )
                    }
                    subheader={
                        !isSystem && (
                            <Moment fromNow locale="en">
                                {post.createdAt}
                            </Moment>
                        )
                    }
                />
                <CardContent className="pos-relative">
                    {flagged && (
                        <div className="pos-absolute post-flag">
                            <div id="flag-pos" className="pos-absolute post-flag-pos" />
                            <FlagIcon fontSize="inherit" color="inherit" />
                        </div>
                    )}
                    <Typography component="p" className="post-content mb-1">
                        <Linkify properties={{ target: '_blank', className: 'color-secondary break-all' }}>
                            {String(showOriginal ? post.original : post.body)
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
                </CardContent>
                {post.media === 'photo' && (
                    <CardMedia
                        className="post-media cursor-pointer"
                        image={post.payload}
                        onClick={this.showLightBox(post.payload)}
                    />
                )}
                {post.media === 'photo_link' && (
                    <CardMedia
                        className="post-media cursor-pointer"
                        image={post.payload.photo}
                        onClick={() => Navigation.openAsync(post.payload.link)}
                    />
                )}
                {post.media === 'youtube' && (
                    <div className="pos-relative post-media">
                        <LazyYoutube className="pos-absolute absolute-fit" videoId={post.payload} />
                    </div>
                )}
                {post.media === 'link' && (
                    <div>
                        <ButtonBase
                            disableRipple
                            disableTouchRipple
                            className="pos-relative post-media post-media-url img-fit"
                            style={{ backgroundImage: `url('${post.payload.image}')` }}
                            onClick={this.handleMediaClick}>
                            <div className="pos-absolute absolute-fit post-media-og">
                                <div className="flex-display flex-align-end">
                                    {/*<div
                                            className="img-contain mr-0-5 icon-32"
                                            style={{ backgroundImage: `url('${post.payload.favicon}')` }}
                                        />*/}
                                    <Typography className="text-shadow" color="inherit">
                                        {post.payload.site_name}
                                    </Typography>
                                </div>
                                <Typography className="text-shadow post-media-title" color="inherit" variant="h5">
                                    {post.payload.title}
                                </Typography>
                            </div>
                        </ButtonBase>
                        <div className="post-media-desc">
                            <Typography className="trans-2 mb-0-5">{post.payload.description}</Typography>
                            <Typography className="trans-3 font-smaller" noWrap>
                                {post.payload.url}
                            </Typography>
                        </div>
                        <Divider />
                    </div>
                )}
                <Collapse in={!this.state.expanded && !single} timeout={200} unmountOnExit>
                    <div className="post-comment-short">
                        {post.commentsPreview.map((comment) => (
                            <div key={comment.id} className="flex-display mb-0-5 mt-0-5">
                                <RouterLink to={`/profile/${comment.author.id}`}>
                                    <Typography
                                        className="flex-show post-comment-short-name mr-1"
                                        color="primary"
                                        noWrap>
                                        <b>{comment.author.username}</b>
                                    </Typography>
                                </RouterLink>
                                <Typography noWrap>{comment.body}</Typography>
                            </div>
                        ))}
                    </div>
                </Collapse>
                <Collapse
                    classes={{ container: single ? 'overflow-visible' : '' }}
                    in={this.state.expanded || single}
                    timeout={200}
                    unmountOnExit>
                    <div className={`post-comments ${single ? 'post-comments-single' : ''}`} ref={this.commentsRef}>
                        {post.comments.map((comment) => {
                            return (
                                <Comment key={comment.id} comment={comment} flagged={flaggedComment === comment.id} />
                            );
                        })}
                    </div>
                    <Divider />
                </Collapse>
                <CardActions className="flex-display pos-relative" disableActionSpacing>
                    <Tooltip title="Like">
                        <IconButton aria-label="Like" onClick={this.handleLikeClick}>
                            <ThumbUpIcon color={this.state.liked ? 'primary' : 'action'} />
                        </IconButton>
                    </Tooltip>
                    {likeCount > 0 && <Typography className="mr-1">{likeCount}</Typography>}
                    <Tooltip title="Comment">
                        <IconButton aria-label="Comment" onClick={this.handleOpenNewComment}>
                            <CommentIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Flag">
                        <IconButton aria-label="Flag" onClick={this.handleFlagClick}>
                            <FlagIcon />
                        </IconButton>
                    </Tooltip>
                    {!single && (
                        <Tooltip title={`${this.state.expanded ? 'Hide' : 'Show'} all comments`}>
                            <IconButton
                                className={`post-comment-expand ${this.state.expanded ? 'is-expanded' : ''}`}
                                onClick={this.handleExpandClick}
                                disabled={commentsProcessing}
                                aria-expanded={this.state.expanded}
                                aria-label={`${this.state.expanded ? 'Hide' : 'Show'} all comments`}>
                                {commentsProcessing ? (
                                    <CircularProgress size={24} color="inherit" />
                                ) : (
                                    <ExpandMoreIcon />
                                )}
                            </IconButton>
                        </Tooltip>
                    )}
                    {newComment && newCommentBox}
                </CardActions>
                <Menu anchorEl={anchorMenu} open={Boolean(anchorMenu)} onClose={this.handleMenuClose}>
                    {canBeDeleted && <MenuItem onClick={this.handleDeleteClick}>Delete</MenuItem>}
                    {canShowOriginal && (
                        <MenuItem onClick={this.handleFilterToggle}>{showOriginal ? 'Hide' : 'Show'} original</MenuItem>
                    )}
                    {canSetRandom && (
                        <MenuItem onClick={this.handleRandomToggle}>
                            {post.isRandom ? 'Disable' : 'Enable'} random
                        </MenuItem>
                    )}
                    {canPinToTop && (
                        <MenuItem onClick={this.handlePinToggle}>
                            {post.isAnnouncement ? 'Unpin from' : 'Pin to'} top
                        </MenuItem>
                    )}
                </Menu>
            </>
        );

        return (
            <Card className={`mb-3 ${single ? 'overflow-visible' : ''}`}>
                {isDeleted ? (
                    <>
                        <div className={`flex-display flex-align-center trans-2 pl-2 pr-2 pb-1 pt-${single ? 2 : 1}`}>
                            <DeleteIcon className="mr-0-5 trans-2" fontSize="small" />
                            <Typography className="font-smaller trans-2 line-compact mr-0-5">
                                This post has been deleted
                            </Typography>
                            <div className="flex-grow" />
                            {!single && (
                                <Button size="small" color="primary" onClick={this.handleShowDeleted}>
                                    {showDeleted ? 'Hide' : 'Show'}
                                </Button>
                            )}
                        </div>
                        {single ? mainPost : <Collapse in={showDeleted}>{mainPost}</Collapse>}
                    </>
                ) : (
                    mainPost
                )}
            </Card>
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
    { getAllComments, createComment, createLike, createReport, deletePost, updatePost }
)(Post);
