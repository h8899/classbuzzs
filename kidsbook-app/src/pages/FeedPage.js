// React
import React, { Component } from 'react';
import { connect } from 'react-redux';
import InfiniteScroll from 'react-infinite-scroller';

// Project
import MainAppLayout from '../components/MainAppLayout';
import Post from '../components/Post';
import { FETCH_POSTS } from '../actions/';
import { fetchPosts } from '../actions/postActions';
import { openIncompleteSurvey } from '../actions/surveyActions';
import DialogConfirm from '../utils/DialogConfirm';
import Navigation from '../navigation';
import { PostFormatter, UserFormatter, CommentFormatter, GroupFormatter, SurveyFormatter } from '../utils/formatter';
import NewPost from '../components/NewPost';

const PRELOAD_COUNT = 2;

class FeedPage extends Component {
    state = {
        activeGroup: null,
        lastPostId: null,
        hasMore: true,
        posts: [],
        postsLastUpdated: null
    };

    // TODO: Optimize more
    /* shouldComponentUpdate(nextProps, nextState) {
        const curState = this.state;
        if (
            curState.activeGroup !== nextState.activeGroup ||
            curState.posts.length !== nextState.posts.length ||
            curState.posts[0] !== nextState.posts[0] ||
            curState.posts[curState.posts.length - 1] !== nextState.posts[curState.posts.length - 1] ||
            curState.postsLastUpdated !== nextState.postsLastUpdated
        ) {
            return true;
        }
        return false;
    } */

    static getDerivedStateFromProps(nextProps, prevState) {
        const nextGroup = nextProps.app.groupId;
        const nextGroupInfo = GroupFormatter.show(nextProps.group[nextGroup]);
        const isSuperuser = UserFormatter.show(nextProps.user[nextProps.auth.realUser]).isSuperuser;
        const newState = {};

        const popupSurveyIfIncomplete = () => {
            if (isSuperuser) return;

            const { survey: surveys } = nextProps;
            const incomplete = nextGroupInfo.surveys.filter((surveyId) => (
                surveys[surveyId] && surveys[surveyId]._popup
            ));
            if (incomplete.length <= 0) return;

            const survey = SurveyFormatter.show(surveys[incomplete[0]]);
            nextProps.openIncompleteSurvey(survey.id);
            DialogConfirm.show('Alert', `You have to complete "${survey.title}" to continue, do you want to complete it now?`, (confirm) => {
                if (confirm) {
                    Navigation.pushAsync(`/survey/${survey.id}`);
                }
            });
        };

        if (nextGroup !== prevState.activeGroup) {
            newState.activeGroup = nextGroup;
            newState.lastPostId = null;
            newState.hasMore = true;
            newState.posts = [];
            if (nextGroup) {
                nextProps.fetchPosts(nextGroup, isSuperuser);
                popupSurveyIfIncomplete();
            }
        } else if (nextGroupInfo._lastUpdated !== prevState.postsLastUpdated) {
            // TODO: Handle deleted posts (Hard) - Need backend modifications
            newState.postsLastUpdated = nextGroupInfo._lastUpdated;

            if (prevState.posts.length <= 0) {
                newState.lastPostId = null;
                newState.hasMore = true;
                newState.posts = [];
            } else {
                const combinedPosts = Array.from(new Set(nextGroupInfo.posts.concat(prevState.posts)));
                // TODO: Now assuming no posts will be deleted, what if `indexOf` failed?
                const endIndex = combinedPosts.indexOf(prevState.lastPostId);
                newState.posts = combinedPosts.slice(0, endIndex + 1);
            }
        }

        return {
            ...prevState,
            ...newState
        };
    }

    loadMore = () => {
        const { app, group } = this.props;
        let { lastPostId, hasMore } = this.state;

        if (!hasMore) return;
        const gr = GroupFormatter.show(group[app.groupId]);
        let postIds = gr.posts;

        let startIndex = 0;
        if (lastPostId) {
            // TODO: Now assuming no posts will be deleted, what if `indexOf` failed?
            startIndex = postIds.indexOf(lastPostId) + 1;
        }
        postIds = postIds.slice(startIndex, startIndex + PRELOAD_COUNT);

        if (postIds.length > 0) {
            lastPostId = postIds[postIds.length - 1];
        }
        if (postIds.length < PRELOAD_COUNT) {
            hasMore = false;
        }

        this.setState(({ posts }) => {
            return {
                hasMore: hasMore,
                lastPostId: lastPostId,
                posts: Array.from(new Set(posts.concat(postIds)))
            };
        });
    };

    render() {
        const { app, comment, group, loading, post, user } = this.props;
        const { posts, hasMore } = this.state;

        const isLoading = loading[FETCH_POSTS][app.groupId];
        const isError = !app.groupId;

        // TODO: Heavy performance issue?
        // Likes and flags are just array of IDs
        const postObjects = posts.map((p) => {
            p = PostFormatter.show(post[p]);
            p.group = GroupFormatter.show(group[p.groupId]);
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
        });

        return (
            <MainAppLayout
                title="Wall Feed"
                showGroupSelector
                allowSwitchGroup
                showLoading={isLoading && !isError}
                errorMessage={
                    isError ? 'You are not in any groups, please ask your admin to add you into a group!' : null
                }>
                <div className="page-feeds">
                    <NewPost />
                    <InfiniteScroll
                        pageStart={0}
                        loadMore={this.loadMore}
                        hasMore={hasMore}
                        threshold={500}
                        useWindow={true}>
                        {postObjects.map((p) => (
                            <Post key={p.id} post={p} />
                        ))}
                    </InfiniteScroll>
                </div>
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
    survey: state.survey,
    user: state.user
});

export default connect(
    mapStateToProps,
    { fetchPosts, openIncompleteSurvey }
)(FeedPage);
