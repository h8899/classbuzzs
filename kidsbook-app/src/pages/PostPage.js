// React
import React, { Component } from 'react';
import { connect } from 'react-redux';

// Project
import Post from '../components/Post';
import MainAppLayout from '../components/MainAppLayout';
import { getPost } from '../actions/postActions';
import { CommentFormatter, PostFormatter, UserFormatter } from '../utils/formatter';
import { GET_POST } from '../actions/';

class PostPage extends Component {
    state = {
        postId: null
    };

    static getDerivedStateFromProps(nextProps, prevState) {
        const postId = nextProps.match.params.postId;
        const newState = {};

        if (postId !== prevState.postId) {
            newState.postId = postId;
            if (postId) nextProps.getPost(postId);
        }

        return {
            ...prevState,
            ...newState
        };
    }

    render() {
        const { postId } = this.state;
        const { comment, loading, post, user } = this.props;

        const isLoading = loading[GET_POST][postId];
        const isValid = Boolean(post[postId]);

        const mainPost = PostFormatter.show(post[postId]);
        mainPost.author = UserFormatter.show(user[mainPost.author]);
        mainPost.comments = mainPost.comments.map((c) => {
            c = CommentFormatter.show(comment[c]);
            c.author = UserFormatter.show(user[c.author]);
            return c;
        });
        mainPost.commentsPreview = mainPost.commentsPreview.map((c) => {
            c = CommentFormatter.show(comment[c]);
            c.author = UserFormatter.show(user[c.author]);
            return c;
        });

        return (
            <MainAppLayout
                title="View Post"
                showLoading={isLoading}
                errorMessage={!isValid && !isLoading ? "The post couldn't be loaded. It might have been removed by the teacher." : null}>
                <div className="page-post">
                    {isValid && <Post post={mainPost} single />}
                </div>
            </MainAppLayout>
        );
    }
}

const mapStateToProps = (state) => ({
    comment: state.comment,
    loading: state.loading,
    post: state.post,
    user: state.user
});

export default connect(
    mapStateToProps,
    { getPost }
)(PostPage);
