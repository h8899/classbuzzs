import {
    LOGIN_USER_REQUEST,
    LOGIN_USER_SUCCESS,
    LOGIN_USER_FAILURE,
    SWITCH_GROUP,
    SWITCH_USER_REQUEST,
    SWITCH_USER_SUCCESS,
    SWITCH_USER_FAILURE,
    LOGOUT_USER
} from './';
import { push } from 'connected-react-router';
import { UserAPI } from '../apis';
import { getUser } from './userActions';
import { getAllIncompleteSurveys } from './surveyActions';
import SnackBarHelper from '../utils/SnackBarHelper';
import { apiDelay } from '../utils/utils';
import { showRandomMessage } from '../utils/CyberWellness';

export function loginUser(username, password) {
    return async (dispatch) => {
        dispatch({
            type: LOGIN_USER_REQUEST,
            payload: {
                username: username,
                password: password
            }
        });

        let response,
            user,
            isSuccess = false;
        await apiDelay();
        try {
            response = await UserAPI.login(username, password);
            user = await getUser(response.userId)(dispatch); // Get the info of the logged in user
            isSuccess = await getAllIncompleteSurveys()(dispatch);
        } catch (e) {
            SnackBarHelper.enqueueSnackbar(String(e.message));
            isSuccess = false;
        }

        if (!isSuccess) {
            dispatch({
                type: LOGIN_USER_FAILURE,
                payload: {}
            });
            return false;
        }

        await showRandomMessage();
        dispatch({
            type: LOGIN_USER_SUCCESS,
            payload: {
                name: response.name,
                token: response.token,
                userId: response.userId,
                user: user
            }
        });

        // Redirect main page
        dispatch(push('/app'));
        return true;
    };
}

export function switchGroup(group_id, redirect) {
    return async (dispatch) => {
        dispatch({
            type: SWITCH_GROUP,
            payload: {
                groupId: group_id
            }
        });

        // Redirect main page
        if (redirect) {
            dispatch(push('/app'));
        }
    };
}

// Switch back to real user if email is null
export function switchUser(email, realId, redirect) {
    return async (dispatch) => {
        dispatch({
            type: SWITCH_USER_REQUEST,
            payload: {}
        });

        let response = {},
            user,
            isSuccess = false;
        await apiDelay();
        try {
            if (email) {
                response = await UserAPI.loginAs(email);
                user = await getUser(response.userId)(dispatch); // Get the info of the switched user
            } else {
                await UserAPI.loginAsReal();
                user = await getUser(realId)(dispatch); // Get the info of real user
                response = {
                    name: user.username,
                    userId: user.id
                };
            }
            isSuccess = true;
        } catch (e) {
            SnackBarHelper.enqueueSnackbar(String(e.message));
            isSuccess = false;
        }

        if (!isSuccess) {
            dispatch({
                type: SWITCH_USER_FAILURE,
                payload: {}
            });
            return false;
        }

        dispatch({
            type: SWITCH_USER_SUCCESS,
            payload: {
                name: response.name,
                token: response.token,
                userId: response.userId,
                user: user
            }
        });

        // Redirect to main page if needed
        if (redirect) {
            dispatch(push('/app'));
        }
        return true;
    };
}

export function logoutUser() {
    return async (dispatch) => {
        dispatch({
            type: LOGOUT_USER,
            payload: {}
        });

        try {
            await UserAPI.logout();
        } catch (e) {
            // Ignore if fail
        }

        // Redirect to login page
        dispatch(push('/'));
    };
}
