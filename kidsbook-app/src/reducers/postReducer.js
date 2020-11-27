import {
    FETCH_POSTS_SUCCESS,
    FETCH_COMMENTS_SUCCESS,
    CREATE_POST_SUCCESS,
    LOGIN_USER_REQUEST,
    LOGOUT_USER,
    CREATE_COMMENT_SUCCESS,
    CREATE_LIKE_SUCCESS,
    GET_ALL_FLAGGED_SUCCESS,
    DELETE_POST_SUCCESS,
    SOCKET_POST_UPDATE,
    GET_POST_SUCCESS,
    UPDATE_POST_SUCCESS
} from '../actions';

import { PostFormatter } from '../utils/formatter';
import isObject from 'is-object';

const initialState = {};

export default function(state = initialState, action) {
    switch (action.type) {
        case FETCH_POSTS_SUCCESS: {
            const { posts } = action.payload;
            const processed = {};

            posts.forEach((p) => {
                processed[p.id] = PostFormatter.parse(p, state[p.id], { commentsPreview: true });
            });

            return {
                ...state,
                ...processed
            };
        }
        case GET_POST_SUCCESS:
        case CREATE_POST_SUCCESS: {
            const { post } = action.payload;

            return {
                ...state,
                [post.id]: PostFormatter.parse(post, state[post.id], { commentsPreview: true })
            };
        }
        case UPDATE_POST_SUCCESS: {
            const { post, postId } = action.payload;

            return {
                ...state,
                [post.id]: PostFormatter.parse(
                    { is_random: post.is_random, is_announcement: post.is_announcement },
                    state[postId]
                )
            };
        }
        case FETCH_COMMENTS_SUCCESS: {
            const { comments, postId } = action.payload;

            // Backend return the comment in ascending order, should show in descending order
            comments.reverse();

            return {
                ...state,
                [postId]: PostFormatter.parse({ comments }, state[postId], { commentsReplace: true })
            };
        }
        case CREATE_COMMENT_SUCCESS: {
            const { comment, postId } = action.payload;

            if (!state[postId]) return state;
            const comments = [comment];

            return {
                ...state,
                [postId]: PostFormatter.parse({ comments }, state[postId])
            };
        }
        case CREATE_LIKE_SUCCESS: {
            const { postId, userId, like } = action.payload;
            if (!state[postId]) return state;

            let likes = [];
            if (Array.isArray(state[postId].likes)) likes = state[postId].likes;
            likes = likes.filter((l) => l !== userId);
            if (like) likes.push(userId);

            return {
                ...state,
                [postId]: PostFormatter.parse({ likes_list: likes }, state[postId], { likeFiltered: true })
            };
        }
        case GET_ALL_FLAGGED_SUCCESS: {
            const { posts, comments } = action.payload;
            const processed = {};

            posts.forEach((p) => {
                p = p.post;
                if (!isObject(p)) return;
                processed[p.id] = PostFormatter.parse(p, state[p.id]);
            });
            comments.forEach((c) => {
                const p = c.post;
                if (!isObject(p)) return;
                processed[p.id] = PostFormatter.parse(p, state[p.id]);
            });

            return {
                ...state,
                ...processed
            };
        }
        case DELETE_POST_SUCCESS: {
            const { postId } = action.payload;
            if (!state[postId]) return state;

            return {
                ...state,
                [postId]: PostFormatter.parse({ is_deleted: true }, state[postId])
            };
        }
        case SOCKET_POST_UPDATE: {
            const { type, post } = action.payload;
            const processed = {};

            // TODO: Handle deleted posts instead of ignore
            if (!isObject(post)) return state;

            switch (type) {
                case 'INSERT':
                case 'UPDATE':
                    processed[post.id] = PostFormatter.parse(post, state[post.id]);
                    break;
                case 'DELETE':
                    processed[post.id] = null;
                    break;
                default:
                    break;
            }

            return {
                ...state,
                ...processed
            };
        }
        case LOGIN_USER_REQUEST:
        case LOGOUT_USER:
            return initialState;
        default:
            return state;
    }
}
