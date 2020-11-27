import {
    FETCH_POSTS_SUCCESS,
    FETCH_COMMENTS_SUCCESS,
    GET_USER_SUCCESS,
    UPDATE_USER_SUCCESS,
    LOGIN_USER_REQUEST,
    LOGOUT_USER,
    GET_ALL_MEMBERS_SUCCESS,
    GET_ALL_ANY_MEMBERS_SUCCESS,
    GET_ALL_VIRTUAL_SUCCESS,
    CREATE_USER_SUCCESS,
    GET_ALL_FLAGGED_SUCCESS,
    FETCH_NOTIFICATIONS_SUCCESS,
    GET_POST_SUCCESS,
    SOCKET_POST_UPDATE
} from '../actions';

import { UserFormatter } from '../utils/formatter';
import isObject from 'is-object';

const initialState = {};

export default function(state = initialState, action) {
    switch (action.type) {
        case UPDATE_USER_SUCCESS:
        case CREATE_USER_SUCCESS:
        case GET_USER_SUCCESS: {
            let { user } = action.payload;

            return {
                ...state,
                [user.id]: UserFormatter.parse(user, state[user.id])
            };
        }
        case FETCH_COMMENTS_SUCCESS:
        case FETCH_POSTS_SUCCESS: {
            const { payload } = action;
            let data = payload[action.type === FETCH_POSTS_SUCCESS ? 'posts' : 'comments'];

            if (!Array.isArray(data)) data = [];
            data = data.filter((d) => isObject(d) && d.creator);

            let users = data.map((d) => d.creator);
            if (action.type === FETCH_POSTS_SUCCESS) {
                users = data
                    .filter((d) => Array.isArray(d.comments))
                    .map((d) => d.comments)
                    .reduce((acc, val) => acc.concat(val), [])
                    .filter((c) => isObject(c) && isObject(c.creator))
                    .map((c) => c.creator)
                    .concat(users);
            }
            const processed = {};

            users.forEach((u) => {
                processed[u.id] = UserFormatter.parse(u, state[u.id]);
            });

            return {
                ...state,
                ...processed
            };
        }
        case GET_ALL_VIRTUAL_SUCCESS:
        case GET_ALL_ANY_MEMBERS_SUCCESS:
        case GET_ALL_MEMBERS_SUCCESS: {
            const { users } = action.payload;
            const processed = {};

            users.forEach((u) => {
                processed[u.id] = UserFormatter.parse(u, state[u.id]);
            });

            if (action.type === GET_ALL_ANY_MEMBERS_SUCCESS) {
                const { userId } = action.payload;
                processed[userId] = UserFormatter.parse(null, state[userId], {
                    children: [...new Set(users.map((u) => u.id))]
                });
            }

            return {
                ...state,
                ...processed
            };
        }
        case GET_ALL_FLAGGED_SUCCESS: {
            const { posts, comments } = action.payload;
            const users = posts.concat(comments).map((f) => ({
                id: f.user_id,
                username: f.user_name,
                photo: f.user_photo
            }));
            const processed = {};

            users.forEach((u) => {
                processed[u.id] = UserFormatter.parse(u, state[u.id]);
            });

            return {
                ...state,
                ...processed
            };
        }
        case FETCH_NOTIFICATIONS_SUCCESS: {
            const { notifications } = action.payload;
            const users = notifications.map((n) => n.action_user);
            const processed = {};

            users.forEach((u) => {
                processed[u.id] = UserFormatter.parse(u, state[u.id]);
            });

            return {
                ...state,
                ...processed
            };
        }
        case SOCKET_POST_UPDATE:
        case GET_POST_SUCCESS: {
            const { post } = action.payload;
            if (!isObject(post) || !isObject(post.creator)) return state;
            const user = post.creator;
            const users = Array.isArray(post.comments)
                ? post.comments.filter((c) => isObject(c) && isObject(c.creator)).map((c) => c.creator)
                : [];
            users.push(user);
            const processed = {};

            users.forEach((u) => {
                processed[u.id] = UserFormatter.parse(u, state[u.id]);
            });

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
