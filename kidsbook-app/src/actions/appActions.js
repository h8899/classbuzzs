import {
    FETCH_NOTIFICATIONS_REQUEST,
    FETCH_NOTIFICATIONS_SUCCESS,
    FETCH_NOTIFICATIONS_FAILURE,
    SEEN_NOTIFICATIONS,
    GET_SETTINGS_REQUEST,
    GET_SETTINGS_SUCCESS,
    GET_SETTINGS_FAILURE,
    UPDATE_SETTINGS_REQUEST,
    UPDATE_SETTINGS_SUCCESS,
    UPDATE_SETTINGS_FAILURE
} from './';
import { apiDelay } from '../utils/utils';
import { UserAPI, ExtensionAPI } from '../apis/';

export function fetchNotifications() {
    return async (dispatch) => {
        dispatch({
            type: FETCH_NOTIFICATIONS_REQUEST,
            payload: {}
        });

        let response;
        await apiDelay();
        try {
            response = await UserAPI.getAllNotifications();
        } catch (e) {
            dispatch({
                type: FETCH_NOTIFICATIONS_FAILURE,
                payload: {}
            });
            return false;
        }

        dispatch({
            type: FETCH_NOTIFICATIONS_SUCCESS,
            payload: {
                notifications: response.notifications,
                unseen: response.unseen
            }
        });
        return true;
    };
}

export function seenNotifications() {
    return async (dispatch) => {
        try {
            await UserAPI.resetNotifications();
        } catch (e) {
            // Ignored
        }

        dispatch({
            type: SEEN_NOTIFICATIONS,
            payload: {}
        });
    };
}

export function getSettings() {
    return async (dispatch) => {
        dispatch({
            type: GET_SETTINGS_REQUEST,
            payload: {}
        });

        let response;
        let extension = { enabled: false };
        await apiDelay();
        try {
            extension = ExtensionAPI.checkNotificationSettings();
            response = await UserAPI.getSettings();
        } catch (e) {
            dispatch({
                type: GET_SETTINGS_FAILURE,
                payload: {}
            });
            return false;
        }

        dispatch({
            type: GET_SETTINGS_SUCCESS,
            payload: {
                settings: {
                    ...response.settings,
                    notificationEnabled: extension.enabled
                }
            }
        });
        return true;
    };
}

export function updateSettings(subscription) {
    return async (dispatch) => {
        dispatch({
            type: UPDATE_SETTINGS_REQUEST,
            payload: {}
        });

        await apiDelay();
        try {
            await ExtensionAPI.updateNotificationSettings(subscription);
            await UserAPI.updateSettings(Boolean(subscription));
        } catch (e) {
            dispatch({
                type: UPDATE_SETTINGS_FAILURE,
                payload: {}
            });
            return {
                error: e.message
            };
        }

        dispatch({
            type: UPDATE_SETTINGS_SUCCESS,
            payload: {
                settings: {
                    notificationEnabled: Boolean(subscription),
                    notificationSubscription: subscription
                }
            }
        });
        return {};
    };
}
