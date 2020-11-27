import {
    GET_USER_SUCCESS,
    FETCH_POSTS_SUCCESS,
    CREATE_POST_SUCCESS,
    UPDATE_GROUP_SUCCESS,
    LOGIN_USER_REQUEST,
    LOGOUT_USER,
    GET_ALL_MEMBERS_SUCCESS,
    GET_ALL_ANY_MEMBERS_SUCCESS,
    GET_ALL_FLAGGED_SUCCESS,
    GET_ALL_SURVEYS_SUCCESS,
    GET_ALL_INCOMPLETE_SURVEYS_SUCCESS,
    CREATE_SURVEY_SUCCESS,
    DELETE_SURVEY_SUCCESS,
    GET_ALL_GAMES_SUCCESS,
    SOCKET_POST_UPDATE,
    UPLOAD_GAME_SUCCESS,
    DELETE_GAME_SUCCESS
} from '../actions';

import isObject from 'is-object';
import { GroupFormatter } from '../utils/formatter';

const initialState = {};

export default function(state = initialState, action) {
    switch (action.type) {
        case GET_USER_SUCCESS: {
            let groups = action.payload.user.user_groups;
            const processed = {};
            if (!Array.isArray(groups)) groups = [];

            groups.forEach((g) => {
                processed[g.id] = GroupFormatter.parse(g, state[g.id], { userFiltered: true });
            });

            return {
                ...state,
                ...processed
            };
        }
        case UPDATE_GROUP_SUCCESS: {
            const { id, name, description } = action.payload.group;

            return {
                ...state,
                [id]: GroupFormatter.parse({ name, description }, state[id])
            };
        }
        case FETCH_POSTS_SUCCESS: {
            const { posts, groupId } = action.payload;

            // TODO: Perhaps there are better way to do this? Will this cause duplication or missing?
            const isRandom = [];
            const isNormal = [];
            const isPinned = [];
            posts.forEach((post) => {
                if (post.is_announcement) {
                    isPinned.push(post);
                } else if (post.is_random) {
                    isRandom.push(post);
                } else {
                    isNormal.push(post);
                }
            });
            isRandom.forEach((post) => {
                const index = Math.floor(Math.random() * isRandom.length * 3);
                isNormal.splice(index, 0, post);
            });
            const allPosts = isPinned.concat(isNormal);

            return {
                ...state,
                [groupId]: GroupFormatter.parse({ posts: allPosts }, state[groupId], { postsReplace: true })
            };
        }
        case CREATE_POST_SUCCESS: {
            const { post, groupId } = action.payload;

            return {
                ...state,
                [groupId]: GroupFormatter.parse(null, state[groupId], { postAdd: post.id })
            };
        }
        case GET_ALL_GAMES_SUCCESS: {
            const { games, groupId } = action.payload;

            return {
                ...state,
                [groupId]: GroupFormatter.parse({ games }, state[groupId])
            };
        }
        case UPLOAD_GAME_SUCCESS: {
            const { game, groupId } = action.payload;

            return {
                ...state,
                [groupId]: GroupFormatter.parse(null, state[groupId], { gameAdd: game.id })
            };
        }
        case DELETE_GAME_SUCCESS: {
            const { gameId } = action.payload;
            const processed = {};

            Object.keys(state).forEach((groupId) => {
                const group = state[groupId];
                if (!isObject(group) || !Array.isArray(group.games) || group.games.indexOf(gameId) < 0) return;
                processed[groupId] = GroupFormatter.parse(null, group, { gameDelete: gameId });
            });

            return {
                ...state,
                ...processed
            };
        }
        case GET_ALL_SURVEYS_SUCCESS: {
            const { surveys, groupId } = action.payload;

            return {
                ...state,
                [groupId]: GroupFormatter.parse({ surveys }, state[groupId])
            };
        }
        case GET_ALL_INCOMPLETE_SURVEYS_SUCCESS: {
            const { surveys } = action.payload;
            const processed = {};

            surveys.forEach(({ id, group: groupId }) => {
                processed[groupId] = GroupFormatter.parse(null, state[groupId], { surveyAdd: id });
            });

            return {
                ...state,
                ...processed
            };
        }
        case CREATE_SURVEY_SUCCESS: {
            const { survey, groupId } = action.payload;

            return {
                ...state,
                [groupId]: GroupFormatter.parse(null, state[groupId], { surveyAdd: survey.id })
            };
        }
        case DELETE_SURVEY_SUCCESS: {
            const { surveyId } = action.payload;
            const processed = {};

            Object.keys(state).forEach((groupId) => {
                const group = state[groupId];
                if (!isObject(group) || !Array.isArray(group.surveys) || group.surveys.indexOf(surveyId) < 0) return;
                processed[groupId] = GroupFormatter.parse(null, group, { surveyDelete: surveyId });
            });

            return {
                ...state,
                ...processed
            };
        }
        case GET_ALL_MEMBERS_SUCCESS: {
            const { users, groupId } = action.payload;

            return {
                ...state,
                [groupId]: GroupFormatter.parse({ users }, state[groupId])
            };
        }
        case GET_ALL_ANY_MEMBERS_SUCCESS: {
            const { users } = action.payload;
            const processed = {};

            let groups = users.filter((u) => isObject(u)).map((u) => u.user_groups);
            groups = groups.reduce((acc, val) => acc.concat(val), []);
            groups.forEach((g) => {
                processed[g.id] = GroupFormatter.parse(g, state[g.id], { userFiltered: true });
            });

            return {
                ...state,
                ...processed
            };
        }
        case GET_ALL_FLAGGED_SUCCESS: {
            const { groupId, posts, comments } = action.payload;
            const flagged = posts.concat(comments);

            return {
                ...state,
                [groupId]: GroupFormatter.parse({ flagged }, state[groupId])
            };
        }
        case SOCKET_POST_UPDATE: {
            const { type, post, groupId } = action.payload;
            const processed = {};

            switch (type) {
                case 'INSERT':
                    processed[groupId] = GroupFormatter.parse(null, state[groupId], { postAdd: post.id });
                    break;
                case 'DELETE':
                    processed[groupId] = GroupFormatter.parse(null, state[groupId], { postDelete: post.id });
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
