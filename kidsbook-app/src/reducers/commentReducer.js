import {
    FETCH_POSTS_SUCCESS,
    FETCH_COMMENTS_SUCCESS,
    LOGIN_USER_REQUEST,
    LOGOUT_USER,
    CREATE_COMMENT_SUCCESS,
    CREATE_COMMENT_LIKE_SUCCESS,
    DELETE_COMMENT_SUCCESS,
    GET_POST_SUCCESS
} from '../actions';

import { CommentFormatter } from '../utils/formatter';
import isObject from 'is-object';

const initialState = {};

export default function(state = initialState, action) {
    switch (action.type) {
        case FETCH_POSTS_SUCCESS: {
            const { posts } = action.payload;
            const processed = {};

            posts.forEach((p) => {
                if (!isObject(p)) return;
                const comments = Array.isArray(p.comments) ? p.comments : [];
                comments.forEach((c) => {
                    processed[c.id] = CommentFormatter.parse(c, state[c.id]);
                });
            });

            return {
                ...state,
                ...processed
            };
        }
        case GET_POST_SUCCESS: {
            const { post } = action.payload;
            if (!isObject(post) || !Array.isArray(post.comments)) return state;
            const processed = {};

            post.comments.forEach((c) => {
                processed[c.id] = CommentFormatter.parse(c, state[c.id]);
            });

            return {
                ...state,
                ...processed
            };
        }
        case FETCH_COMMENTS_SUCCESS: {
            const { comments } = action.payload;
            const processed = {};

            comments.forEach((c) => {
                processed[c.id] = CommentFormatter.parse(c, state[c.id]);
            });

            return {
                ...state,
                ...processed
            };
        }
        case CREATE_COMMENT_SUCCESS: {
            const { comment } = action.payload;

            return {
                ...state,
                [comment.id]: CommentFormatter.parse(comment, state[comment.id])
            };
        }
        case CREATE_COMMENT_LIKE_SUCCESS: {
            const { commentId, userId, like } = action.payload;
            if (!state[commentId]) return state;

            let likes = [];
            if (Array.isArray(state[commentId].likes)) likes = state[commentId].likes;
            likes = likes.filter((l) => l !== userId);
            if (like) likes.push(userId);

            return {
                ...state,
                [commentId]: CommentFormatter.parse({ likers: likes }, state[commentId], { likeFiltered: true })
            };
        }
        case DELETE_COMMENT_SUCCESS: {
            const { commentId } = action.payload;
            if (!state[commentId]) return state;

            return {
                ...state,
                [commentId]: CommentFormatter.parse({ is_deleted: true }, state[commentId])
            };
        }
        case LOGIN_USER_REQUEST:
        case LOGOUT_USER:
            return initialState;
        default:
            return state;
    }
}
