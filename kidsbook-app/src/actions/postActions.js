import {
    FETCH_POSTS_REQUEST,
    FETCH_POSTS_SUCCESS,
    FETCH_POSTS_FAILURE,
    CREATE_POST_REQUEST,
    CREATE_POST_SUCCESS,
    CREATE_POST_FAILURE,
    CREATE_LIKE_REQUEST,
    CREATE_LIKE_SUCCESS,
    CREATE_LIKE_FAILURE,
    CREATE_FLAG_REQUEST,
    CREATE_FLAG_SUCCESS,
    CREATE_FLAG_FAILURE,
    DELETE_POST_REQUEST,
    DELETE_POST_SUCCESS,
    DELETE_POST_FAILURE,
    GET_POST_REQUEST,
    GET_POST_SUCCESS,
    GET_POST_FAILURE,
    UPDATE_POST_REQUEST,
    UPDATE_POST_SUCCESS,
    UPDATE_POST_FAILURE
} from './';
import { GroupAPI, PostAPI } from '../apis';
import SnackBarHelper from '../utils/SnackBarHelper';
import { apiDelay } from '../utils/utils';

export function fetchPosts(group_id, includeDeleted) {
    return async (dispatch) => {
        dispatch({
            type: FETCH_POSTS_REQUEST,
            payload: {
                groupId: group_id
            }
        });

        let response;
        await apiDelay();
        try {
            response = await GroupAPI.getAllPosts(group_id, includeDeleted);
        } catch (e) {
            SnackBarHelper.enqueueSnackbar(String(e.message));
            dispatch({
                type: FETCH_POSTS_FAILURE,
                payload: {
                    groupId: group_id
                }
            });
            return false;
        }

        dispatch({
            type: FETCH_POSTS_SUCCESS,
            payload: {
                posts: response.posts,
                groupId: group_id
            }
        });
        return true;
    };
}

export function createPost(group_id, content, media, payload, is_sponsored, confirm_profanity) {
    return async (dispatch) => {
        dispatch({
            type: CREATE_POST_REQUEST,
            payload: {}
        });

        let response;
        await apiDelay();
        try {
            response = await GroupAPI.createPost(group_id, content, media, payload, is_sponsored, confirm_profanity);
        } catch (e) {
            dispatch({
                type: CREATE_POST_FAILURE,
                payload: {
                    error: e.message
                }
            });
            if (e.message !== 'Unable to create the post due to profanity') {
                SnackBarHelper.enqueueSnackbar(String(e.message));
                return null;
            } else {
                return {
                    needProfanityConfirm: true
                };
            }
        }

        const reduxPayload = {
            post: response.post,
            hasProfanity: response.hasProfanity,
            needProfanityConfirm: false,
            groupId: group_id
        };
        dispatch({
            type: CREATE_POST_SUCCESS,
            payload: reduxPayload
        });

        return reduxPayload;
    };
}

// TODO: fetchLike after success
export function createLike(post_id, like) {
    return async (dispatch) => {
        dispatch({
            type: CREATE_LIKE_REQUEST,
            payload: {
                postId: post_id
            }
        });

        let response;
        await apiDelay();
        try {
            response = await PostAPI.createLike(post_id, like);
        } catch (e) {
            SnackBarHelper.enqueueSnackbar(String(e.message));
            dispatch({
                type: CREATE_LIKE_FAILURE,
                payload: {
                    postId: post_id,
                    error: e.message
                }
            });
            return false;
        }

        dispatch({
            type: CREATE_LIKE_SUCCESS,
            payload: {
                postId: post_id,
                userId: response.userId,
                like: response.like
            }
        });
        return true;
    };
}

export function createReport(post_id) {
    return async (dispatch) => {
        dispatch({
            type: CREATE_FLAG_REQUEST,
            payload: {}
        });

        await apiDelay();
        try {
            await PostAPI.createReport(post_id);
        } catch (e) {
            SnackBarHelper.enqueueSnackbar(String(e.message));
            dispatch({
                type: CREATE_FLAG_FAILURE,
                payload: {
                    error: e.message
                }
            });
            return false;
        }
        dispatch({
            type: CREATE_FLAG_SUCCESS,
            payload: {}
        });
        return true;
    };
}

export function deletePost(post_id) {
    return async (dispatch) => {
        dispatch({
            type: DELETE_POST_REQUEST,
            payload: {
                postId: post_id
            }
        });

        await apiDelay();
        try {
            await PostAPI.deletePost(post_id);
        } catch (e) {
            SnackBarHelper.enqueueSnackbar(String(e.message));
            dispatch({
                type: DELETE_POST_FAILURE,
                payload: {
                    error: e.message,
                    postId: post_id
                }
            });
            return false;
        }

        dispatch({
            type: DELETE_POST_SUCCESS,
            payload: {
                postId: post_id
            }
        });
        return true;
    };
}

export function getPost(post_id) {
    return async (dispatch) => {
        dispatch({
            type: GET_POST_REQUEST,
            payload: {
                postId: post_id
            }
        });

        let response;
        await apiDelay();
        try {
            response = await PostAPI.get(post_id);
        } catch (e) {
            dispatch({
                type: GET_POST_FAILURE,
                payload: {
                    error: e.message,
                    postId: post_id
                }
            });
            return false;
        }

        dispatch({
            type: GET_POST_SUCCESS,
            payload: {
                post: response.post,
                postId: post_id
            }
        });
        return true;
    };
}

export function updatePost(post_id, is_random, is_announcement) {
    return async (dispatch) => {
        dispatch({
            type: UPDATE_POST_REQUEST,
            payload: {
                postId: post_id
            }
        });

        let response;
        await apiDelay();
        try {
            response = await PostAPI.update(post_id, is_random, is_announcement);
        } catch (e) {
            dispatch({
                type: UPDATE_POST_FAILURE,
                payload: {
                    error: e.message,
                    postId: post_id
                }
            });
            return false;
        }

        dispatch({
            type: UPDATE_POST_SUCCESS,
            payload: {
                post: response.post,
                postId: post_id
            }
        });
        return true;
    };
}
