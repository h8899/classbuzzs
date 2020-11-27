import {
    GET_USER_REQUEST,
    GET_USER_SUCCESS,
    GET_USER_FAILURE,
    CREATE_USER_REQUEST,
    CREATE_USER_SUCCESS,
    CREATE_USER_FAILURE,
    IMPORT_USERS_REQUEST,
    IMPORT_USERS_SUCCESS,
    IMPORT_USERS_FAILURE,
    UPDATE_USER_REQUEST,
    UPDATE_USER_SUCCESS,
    UPDATE_USER_FAILURE,
    GET_ALL_VIRTUAL_REQUEST,
    GET_ALL_VIRTUAL_SUCCESS,
    GET_ALL_VIRTUAL_FAILURE,
    GET_ALL_ANY_MEMBERS_REQUEST,
    GET_ALL_ANY_MEMBERS_SUCCESS,
    GET_ALL_ANY_MEMBERS_FAILURE
} from './';
import { UserAPI } from '../apis';
import SnackBarHelper from '../utils/SnackBarHelper';
import { addUserToGroup } from './groupActions';
import { apiDelay } from '../utils/utils';

export function getUser(user_id) {
    return async (dispatch) => {
        dispatch({
            type: GET_USER_REQUEST,
            payload: {
                userId: user_id
            }
        });

        let response;
        await apiDelay();
        try {
            response = await UserAPI.get(user_id);
        } catch (e) {
            SnackBarHelper.enqueueSnackbar(String(e.message));
            dispatch({
                type: GET_USER_FAILURE,
                payload: {
                    userId: user_id
                }
            });
            return null;
        }

        dispatch({
            type: GET_USER_SUCCESS,
            payload: {
                user: response.user,
                userId: user_id
            }
        });
        return response.user;
    };
}

export function createUser(type, username, password, realname, email, teacherId, groupId) {
    return async (dispatch) => {
        dispatch({
            type: CREATE_USER_REQUEST,
            payload: {}
        });

        let response,
            isSuccess = false,
            err;
        await apiDelay();
        try {
            response = await UserAPI.create(type, username, password, realname, email, teacherId);
            if (groupId) {
                await addUserToGroup(response.user.id, groupId)(dispatch);
            }
            isSuccess = true;
        } catch (e) {
            SnackBarHelper.enqueueSnackbar(String(e.message));
            err = e.message;
            isSuccess = false;
        }

        if (!isSuccess) {
            dispatch({
                type: CREATE_USER_FAILURE,
                payload: {
                    error: err
                }
            });
            return null;
        }

        dispatch({
            type: CREATE_USER_SUCCESS,
            payload: {
                user: response.user
            }
        });
        return response.user;
    };
}

// TODO: It is not reliable at all :(
export function importUsers(rawCSV, groupId) {
    return async (dispatch) => {
        dispatch({
            type: IMPORT_USERS_REQUEST,
            payload: {}
        });

        let response;
        await apiDelay();
        try {
            response = await UserAPI.import(rawCSV);
            // Ignore any errors for now
            if (groupId) {
                let users = response.success;
                let promises = [];
                for (let i = 0; i < users.length; i++) {
                    promises.push(addUserToGroup(users[i], groupId)(dispatch));
                    if (promises.length >= 10) { // 10 users at once
                        await Promise.all(promises);
                        promises = [];
                    }
                }
            }
        } catch (e) {
            SnackBarHelper.enqueueSnackbar(String(e.message));
            dispatch({
                type: IMPORT_USERS_FAILURE,
                payload: {
                    error: e.message
                }
            });
            return false;
        }

        dispatch({
            type: IMPORT_USERS_SUCCESS,
            payload: {
                success: response.success
            }
        });
        return true;
    };
}

export function updateUser(user_id, state, isUpdatePassword, isUpdatePhoto) {
    return async (dispatch) => {
        dispatch({
            type: UPDATE_USER_REQUEST,
            payload: {
                userId: user_id
            }
        });

        let response;
        await apiDelay();
        try {
            if (isUpdatePassword) {
                if (state.newPassword !== state.confirmPassword) throw new Error('Passwords do not match');
                if (!state.newPassword) throw new Error('Passwords cannot be empty');
            }
            response = await UserAPI.update(user_id, state, isUpdatePassword, isUpdatePhoto);
        } catch (e) {
            SnackBarHelper.enqueueSnackbar(String(e.message));
            dispatch({
                type: UPDATE_USER_FAILURE,
                payload: {
                    userId: user_id,
                    error: e.message
                }
            });
            return null;
        }

        dispatch({
            type: UPDATE_USER_SUCCESS,
            payload: {
                user: response.user,
                userId: user_id
            }
        });
        return response.user;
    };
}

export function getAllVirtual() {
    return async (dispatch) => {
        dispatch({
            type: GET_ALL_VIRTUAL_REQUEST,
            payload: {}
        });

        let response;
        await apiDelay();
        try {
            response = await UserAPI.getAllVirtual();
        } catch (e) {
            dispatch({
                type: GET_ALL_VIRTUAL_FAILURE,
                payload: {
                    error: e.message
                }
            });
            return false;
        }

        dispatch({
            type: GET_ALL_VIRTUAL_SUCCESS,
            payload: {
                users: response.users
            }
        });
        return true;
    };
}

export function getAllInAny(user_id) {
    return async (dispatch) => {
        dispatch({
            type: GET_ALL_ANY_MEMBERS_REQUEST,
            payload: {
                userId: user_id
            }
        });

        let response;
        await apiDelay();
        try {
            response = await UserAPI.getAllValid();
        } catch (e) {
            dispatch({
                type: GET_ALL_ANY_MEMBERS_FAILURE,
                payload: {
                    userId: user_id,
                    error: e.message
                }
            });
            return false;
        }

        dispatch({
            type: GET_ALL_ANY_MEMBERS_SUCCESS,
            payload: {
                userId: user_id,
                users: response.users
            }
        });
        return true;
    };
}
