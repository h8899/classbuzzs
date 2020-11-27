import {
    FETCH_COMMENTS_REQUEST,
    FETCH_COMMENTS_SUCCESS,
    FETCH_COMMENTS_FAILURE,
    CREATE_COMMENT_FAILURE,
    CREATE_COMMENT_REQUEST,
    CREATE_COMMENT_SUCCESS,
    CREATE_COMMENT_LIKE_REQUEST,
    CREATE_COMMENT_LIKE_SUCCESS,
    CREATE_COMMENT_LIKE_FAILURE,
    CREATE_COMMENT_FLAG_REQUEST,
    CREATE_COMMENT_FLAG_SUCCESS,
    CREATE_COMMENT_FLAG_FAILURE,
    DELETE_COMMENT_REQUEST,
    DELETE_COMMENT_SUCCESS,
    DELETE_COMMENT_FAILURE
} from './';
import { PostAPI, CommentAPI } from '../apis';
import SnackBarHelper from '../utils/SnackBarHelper';
import { apiDelay } from '../utils/utils';

export function getAllComments(post_id, includeDeleted) {
    return async (dispatch) => {
        dispatch({
            type: FETCH_COMMENTS_REQUEST,
            payload: {
                postId: post_id
            }
        });

        let response;
        await apiDelay();
        try {
            response = await PostAPI.getAllComments(post_id, includeDeleted);
        } catch (e) {
            dispatch({
                type: FETCH_COMMENTS_FAILURE,
                payload: {
                    postId: post_id,
                    error: e.message
                }
            });
            return false;
        }

        dispatch({
            type: FETCH_COMMENTS_SUCCESS,
            payload: {
                comments: response.comments,
                postId: post_id
            }
        });
        return true;
    };
}

export function createComment(post_id, content) {
    return async (dispatch) => {
        dispatch({
            type: CREATE_COMMENT_REQUEST,
            payload: {
                postId: post_id
            }
        });

        let response;
        await apiDelay();
        try {
            response = await PostAPI.createComment(post_id, content);
        } catch (e) {
            SnackBarHelper.enqueueSnackbar(String(e.message));
            dispatch({
                type: CREATE_COMMENT_FAILURE,
                payload: {
                    error: e.message,
                    postId: post_id
                }
            });
            return false;
        }

        dispatch({
            type: CREATE_COMMENT_SUCCESS,
            payload: {
                comment: response.comment,
                postId: post_id
            }
        });
        return true;
    };
}

// TODO: fetchCommentLike after success
export function createCommentLike(comment_id, like) {
    return async (dispatch) => {
        dispatch({
            type: CREATE_COMMENT_LIKE_REQUEST,
            payload: {
                commentId: comment_id
            }
        });

        let response;
        await apiDelay();
        try {
            response = await CommentAPI.createLike(comment_id, like);
        } catch (e) {
            SnackBarHelper.enqueueSnackbar(String(e.message));
            dispatch({
                type: CREATE_COMMENT_LIKE_FAILURE,
                payload: {
                    commentId: comment_id,
                    error: e.message
                }
            });
            return false;
        }

        dispatch({
            type: CREATE_COMMENT_LIKE_SUCCESS,
            payload: {
                commentId: comment_id,
                userId: response.userId,
                like: response.like
            }
        });
        return true;
    };
}

export function createCommentReport(comment_id) {
    return async (dispatch) => {
        dispatch({
            type: CREATE_COMMENT_FLAG_REQUEST,
            payload: {}
        });

        await apiDelay();
        try {
            await CommentAPI.createReport(comment_id);
        } catch (e) {
            SnackBarHelper.enqueueSnackbar(String(e.message));
            dispatch({
                type: CREATE_COMMENT_FLAG_FAILURE,
                payload: {
                    error: e.message
                }
            });
            return false;
        }
        dispatch({
            type: CREATE_COMMENT_FLAG_SUCCESS,
            payload: {}
        });
        return true;
    };
}

export function deleteComment(comment_id) {
    return async (dispatch) => {
        dispatch({
            type: DELETE_COMMENT_REQUEST,
            payload: {
                commentId: comment_id
            }
        });

        await apiDelay();
        try {
            await CommentAPI.deleteComment(comment_id);
        } catch (e) {
            SnackBarHelper.enqueueSnackbar(String(e.message));
            dispatch({
                type: DELETE_COMMENT_FAILURE,
                payload: {
                    error: e.message,
                    commentId: comment_id
                }
            });
            return false;
        }

        dispatch({
            type: DELETE_COMMENT_SUCCESS,
            payload: {
                commentId: comment_id
            }
        });
        return true;
    };
}
