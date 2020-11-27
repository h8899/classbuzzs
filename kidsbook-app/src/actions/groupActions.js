import {
    CREATE_GROUP_REQUEST,
    CREATE_GROUP_SUCCESS,
    CREATE_GROUP_FAILURE,
    UPDATE_GROUP_REQUEST,
    UPDATE_GROUP_SUCCESS,
    UPDATE_GROUP_FAILURE,
    GET_ALL_MEMBERS_REQUEST,
    GET_ALL_MEMBERS_SUCCESS,
    GET_ALL_MEMBERS_FAILURE,
    ADD_USER_TO_GROUP_REQUEST,
    ADD_USER_TO_GROUP_SUCCESS,
    ADD_USER_TO_GROUP_FAILURE,
    ADD_USERS_TO_GROUP_REQUEST,
    ADD_USERS_TO_GROUP_SUCCESS,
    ADD_USERS_TO_GROUP_FAILURE,
    GET_ALL_FLAGGED_REQUEST,
    GET_ALL_FLAGGED_SUCCESS,
    GET_ALL_FLAGGED_FAILURE
} from './';
import { GroupAPI } from '../apis';
import SnackBarHelper from '../utils/SnackBarHelper';
import { apiDelay } from '../utils/utils';

export function createGroup(name) {
    return async (dispatch) => {
        dispatch({
            type: CREATE_GROUP_REQUEST,
            payload: {}
        });

        let response;
        await apiDelay();
        try {
            response = await GroupAPI.create(name);
        } catch (e) {
            SnackBarHelper.enqueueSnackbar(String(e.message));
            dispatch({
                type: CREATE_GROUP_FAILURE,
                payload: {
                    error: e.message
                }
            });
            return false;
        }

        dispatch({
            type: CREATE_GROUP_SUCCESS,
            payload: {
                groupId: response.created_id
            }
        });
        return true;
    };
}

export function updateGroup(group_id, state, isUpdatePhoto) {
    return async (dispatch) => {
        dispatch({
            type: UPDATE_GROUP_REQUEST,
            payload: {}
        });

        let response;
        await apiDelay();
        try {
            response = await GroupAPI.update(group_id, state, isUpdatePhoto);
        } catch (e) {
            SnackBarHelper.enqueueSnackbar(String(e.message));
            dispatch({
                type: UPDATE_GROUP_FAILURE,
                payload: {
                    error: e.message
                }
            });
            return false;
        }

        dispatch({
            type: UPDATE_GROUP_SUCCESS,
            payload: {
                group: response.group
            }
        });
        return true;
    };
}

export function getAllMembers(group_id) {
    return async (dispatch) => {
        dispatch({
            type: GET_ALL_MEMBERS_REQUEST,
            payload: {
                groupId: group_id
            }
        });

        let response;
        await apiDelay();
        try {
            response = await GroupAPI.getAllUsers(group_id);
        } catch (e) {
            SnackBarHelper.enqueueSnackbar(String(e.message));
            dispatch({
                type: GET_ALL_MEMBERS_FAILURE,
                payload: {
                    groupId: group_id,
                    error: e.message
                }
            });
            return null;
        }

        const payload = {
            groupId: group_id,
            users: response.users
        };
        dispatch({
            type: GET_ALL_MEMBERS_SUCCESS,
            payload: payload
        });

        return payload;
    };
}

export function addUserToGroup(user_id, group_id) {
    return async (dispatch) => {
        dispatch({
            type: ADD_USER_TO_GROUP_REQUEST,
            payload: {
                userId: user_id,
                groupId: group_id
            }
        });

        await apiDelay();
        try {
            await GroupAPI.addUser(user_id, group_id);
        } catch (e) {
            // TODO: Add this if necessary
            // SnackBarHelper.enqueueSnackbar(String(e.message));
            dispatch({
                type: ADD_USER_TO_GROUP_FAILURE,
                payload: {
                    userId: user_id,
                    groupId: group_id,
                    error: e.message
                }
            });
            return false;
        }

        dispatch({
            type: ADD_USER_TO_GROUP_SUCCESS,
            payload: {
                userId: user_id,
                groupId: group_id
            }
        });
        return true;
    };
}

// TODO: I am not sure what am I doing here but we have no timeeeee aka technical debt
export function addUsersToGroup(user_ids, group_id) {
    return async (dispatch) => {
        dispatch({
            type: ADD_USERS_TO_GROUP_REQUEST,
            payload: {
                userIds: user_ids,
                groupId: group_id
            }
        });

        await apiDelay();
        try {
            let promises = [];
            for (let i = 0; i < user_ids.length; i++) {
                promises.push(addUserToGroup(user_ids[i], group_id)(dispatch));
                if (promises.length >= 10) { // 10 users at once
                    await Promise.all(promises);
                    promises = [];
                }
            }
        } catch (e) {
            SnackBarHelper.enqueueSnackbar(String(e.message));
            dispatch({
                type: ADD_USERS_TO_GROUP_FAILURE,
                payload: {
                    userIds: user_ids,
                    groupId: group_id,
                    error: e.message
                }
            });
            return false;
        }

        dispatch({
            type: ADD_USERS_TO_GROUP_SUCCESS,
            payload: {
                userIds: user_ids,
                groupId: group_id
            }
        });
        return true;
    };
}

export function getAllFlagged(group_id) {
    return async (dispatch) => {
        dispatch({
            type: GET_ALL_FLAGGED_REQUEST,
            payload: {
                groupId: group_id
            }
        });

        let response;
        await apiDelay();
        try {
            response = await GroupAPI.getAllFlagged(group_id);
        } catch (e) {
            SnackBarHelper.enqueueSnackbar(String(e.message));
            dispatch({
                type: GET_ALL_FLAGGED_FAILURE,
                payload: {
                    groupId: group_id,
                    error: e.message
                }
            });
            return false;
        }

        dispatch({
            type: GET_ALL_FLAGGED_SUCCESS,
            payload: {
                groupId: group_id,
                posts: response.posts,
                comments: response.comments
            }
        });
        return true;
    };
}
