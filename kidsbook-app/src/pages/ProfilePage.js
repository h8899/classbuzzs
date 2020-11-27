// React
import React, { Component } from 'react';
import { connect } from 'react-redux';
import isObject from 'is-object';

// Material UI
import {
    Button,
    Card,
    CardActions,
    CardContent,
    CardMedia,
    CircularProgress,
    IconButton,
    Typography
} from '@material-ui/core';
import {
    CalendarToday as CalendarTodayIcon,
    Comment as CommentIcon,
    Edit as EditIcon,
    Forum as ForumIcon,
    ThumbUp as ThumbUpIcon,
    ThumbUpOutlined as ThumbUpOutlinedIcon
} from '@material-ui/icons';

// Project
import Post from '../components/Post';
import Navigation from '../navigation';
import MainAppLayout from '../components/MainAppLayout.js';
import { fetchPosts } from '../actions/postActions';
import { getUser } from '../actions/userActions';
import { GET_USER, FETCH_POSTS } from '../actions/';
import { PostFormatter, UserFormatter, CommentFormatter } from '../utils/formatter';

class ProfilePage extends Component {
    state = {
        userId: null,
        posts: []
    };

    static getDerivedStateFromProps(nextProps, prevState) {
        const nextEffectiveUser = nextProps.auth.effectiveUser;
        const nextGroupId = nextProps.app.groupId;
        const paramUserId = nextProps.match.params.userId;
        const isSuperuser = UserFormatter.show(nextProps.user[nextProps.auth.realUser]).isSuperuser;
        const { userId } = prevState;
        const newState = {};

        if (!paramUserId && userId !== nextEffectiveUser) {
            newState.userId = nextEffectiveUser;
            if (nextEffectiveUser) nextProps.getUser(nextEffectiveUser);
            if (nextGroupId) nextProps.fetchPosts(nextGroupId, isSuperuser);
        } else if (paramUserId && paramUserId !== prevState.userId) {
            newState.userId = paramUserId;
            nextProps.getUser(nextEffectiveUser);
            if (nextGroupId) nextProps.fetchPosts(nextGroupId, isSuperuser);
        }

        return {
            ...prevState,
            ...newState
        };
    }

    componentDidMount() {
        const { effectiveUser } = this.props.auth;
        let { userId } = this.props.match.params;
        if (!userId) userId = effectiveUser;

        this.setState({ userId });
        this.props.getUser(userId);

        if (this.props.app.groupId) {
            const isSuperuser = UserFormatter.show(this.props.user[this.props.auth.realUser]).isSuperuser;
            this.props.fetchPosts(this.props.app.groupId, isSuperuser);
        }
    }

    render() {
        // role doesn't always reply from the server, use isSuperuser for now
        const { app, auth, comment, group, loading, post, user } = this.props;
        const { userId } = this.state;

        const profile = UserFormatter.show(user[userId]);
        profile.role = profile.isSuperuser ? 1 : 2;

        let stats = profile.stats[app.groupId];
        if (!isObject(stats)) stats = {};
        if (isNaN(stats.post)) stats.post = 0;
        if (isNaN(stats.comment)) stats.comment = 0;
        if (isNaN(stats.likeGiven)) stats.likeGiven = 0;
        if (isNaN(stats.likeReceived)) stats.likeReceived = 0;

        const isValid = Boolean(user[userId]);
        const isLoading = loading[GET_USER][userId] || loading[FETCH_POSTS][app.groupId];
        const isOwner = userId === auth.effectiveUser;
        let posts = [];

        if (isValid && app.groupId && group[app.groupId] && Array.isArray(group[app.groupId].posts)) {
            posts = group[app.groupId].posts
                .map((p) => {
                    p = PostFormatter.show(post[p]);
                    p.group = group[p.groupId]; // TODO: GroupFormatter
                    p.author = UserFormatter.show(user[p.author]);
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
                    return p;
                })
                .filter((p) => p.author.id === userId);
        }

        return (
            <MainAppLayout
                title={profile.username ? `${profile.username}'s Profile` : `Profile`}
                showGroupSelector
                allowSwitchGroup
                showLoading={isLoading && isValid}
                errorMessage={!isLoading && !isValid ? "The profile could'nt be loaded" : null}>
                {isValid && (
                    <div className="page-profile flex-display flex-align-start">
                        <Card className="profile-card pos-relative">
                            {profile.photo ? (
                                <CardMedia className="profile-card-photo" image={profile.photo} />
                            ) : (
                                <div className="profile-card-photo" />
                            )}
                            <CardContent>
                                <div>
                                    <Typography align="center" variant="h5" color="primary">
                                        <b>{profile.username}</b>
                                    </Typography>
                                    {/* TODO: Role not fully supported */}
                                    <Typography align="center" className="mb-3 trans-2">
                                        {profile.role === 1
                                            ? 'Teacher'
                                            : profile.role === 2 || profile.role === 3
                                                ? 'Student'
                                                : '-'}
                                    </Typography>
                                </div>
                                {/* TODO: Support statistics */}
                                <div className="trans-1 profile-stats">
                                    {/* FIXME: Show other stats */}
                                    {/*<div className="flex-display flex-align-center mb-0-5 profile-stat">
                                        <CalendarTodayIcon
                                            className="trans-3 mr-2 profile-stat-icon"
                                            fontSize="small"
                                        />
                                        <Typography>
                                            <b className="font-larger profile-stat-value">0</b> days visited
                                        </Typography>
                                    </div>*/}
                                    <div className="flex-display flex-align-center mb-0-5 profile-stat">
                                        <ForumIcon className="trans-3 mr-2 profile-stat-icon" fontSize="small" />
                                        <Typography>
                                            <b className="font-larger profile-stat-value">{stats.post}</b> posts
                                        </Typography>
                                    </div>
                                    <div className="flex-display flex-align-center mb-0-5 profile-stat">
                                        <CommentIcon className="trans-3 mr-2 profile-stat-icon" fontSize="small" />
                                        <Typography>
                                            <b className="font-larger profile-stat-value">{stats.comment}</b>{' '}
                                            comments
                                        </Typography>
                                    </div>
                                    <div className="flex-display flex-align-center mb-0-5 profile-stat">
                                        <ThumbUpIcon className="trans-3 mr-2 profile-stat-icon" fontSize="small" />
                                        <Typography>
                                            <b className="font-larger profile-stat-value">{stats.likeGiven}</b>{' '}
                                            likes given
                                        </Typography>
                                    </div>
                                    <div className="flex-display flex-align-center mb-0-5 profile-stat">
                                        <ThumbUpOutlinedIcon
                                            className="trans-3 mr-2 profile-stat-icon"
                                            fontSize="small"
                                        />
                                        <Typography>
                                            <b className="font-larger profile-stat-value">
                                                {stats.likeReceived}
                                            </b>{' '}
                                            likes received
                                        </Typography>
                                    </div>
                                </div>
                            </CardContent>
                            {isOwner && (
                                <>
                                    <CardActions className="mb-2 profile-action">
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            color="primary"
                                            onClick={() => Navigation.push('/settings')}>
                                            Edit profile
                                        </Button>
                                    </CardActions>
                                    <IconButton
                                        className="pos-absolute profile-edit"
                                        onClick={() => Navigation.push('/settings')}>
                                        <EditIcon />
                                    </IconButton>
                                </>
                            )}
                        </Card>
                        <div className="flex-grow profile-contents">
                            <Card className="mb-3 profile-about">
                                <Typography className="mb-1" variant="h6">
                                    About me
                                </Typography>
                                <Typography className="break-word">
                                    {String(profile.description)
                                        .split('\n')
                                        .map((line, i) => {
                                            return (
                                                <span key={i}>
                                                    {line}
                                                    <br />
                                                </span>
                                            );
                                        })}
                                </Typography>
                            </Card>
                            {posts.length <= 0 ? (
                                <Typography align="center" className="mt-2 trans-2 break-word">
                                    This user has not posted anything yet
                                </Typography>
                            ) : (
                                posts.map((p) => <Post key={p.id} post={p} />)
                            )}
                        </div>
                    </div>
                )}
                {isLoading && !isValid ? (
                    <div className="size-full flex-display flex-align-center flex-justify-center">
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
    group: state.group,
    loading: state.loading,
    post: state.post,
    user: state.user
});

export default connect(
    mapStateToProps,
    { getUser, fetchPosts }
)(ProfilePage);
