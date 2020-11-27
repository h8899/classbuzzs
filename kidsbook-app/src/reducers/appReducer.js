import {
    LOGIN_USER_SUCCESS,
    SWITCH_GROUP,
    LOGIN_USER_REQUEST,
    LOGOUT_USER,
    FETCH_NOTIFICATIONS_SUCCESS,
    SEEN_NOTIFICATIONS,
    GET_SETTINGS_SUCCESS,
    UPDATE_SETTINGS_SUCCESS
} from '../actions';
import { NotificationFormatter } from '../utils/formatter';
import { mergeObject } from '../utils/utils';

const initialState = {
    groupId: null,
    notification: {
        unseen: 0,
        notifications: [],
        subscription: null,
        enabled: false,
        globalEnabled: false
    }
};

export default function(state = initialState, action) {
    switch (action.type) {
        case LOGIN_USER_SUCCESS: {
            const groups = action.payload.user.user_groups;

            // No group available or already selected a valid group
            if (groups.map((g) => g.id).indexOf(state.groupId) >= 0) return state;
            if (groups.length <= 0) return initialState;

            return {
                ...state,
                groupId: groups[0].id
            };
        }
        case SWITCH_GROUP: {
            const { groupId } = action.payload;

            return {
                ...state,
                groupId: groupId
            };
        }
        case FETCH_NOTIFICATIONS_SUCCESS: {
            const { unseen } = action.payload;
            let { notifications } = action.payload;

            notifications = notifications.map((n) => NotificationFormatter.parse(n));

            return {
                ...state,
                notification: {
                    ...state.notification,
                    notifications,
                    unseen
                }
            };
        }
        case SEEN_NOTIFICATIONS: {
            return {
                ...state,
                notification: {
                    ...state.notification,
                    unseen: 0
                }
            };
        }
        case UPDATE_SETTINGS_SUCCESS:
        case GET_SETTINGS_SUCCESS: {
            const { settings } = action.payload;

            return {
                ...state,
                notification: mergeObject(state.notification, {
                    subscription: settings.notificationSubscription,
                    enabled: settings.notificationEnabled,
                    globalEnabled: settings.receiveNotifications
                })
            };
        }
        case LOGIN_USER_REQUEST:
        case LOGOUT_USER:
            return initialState;
        default:
            return state;
    }
}
