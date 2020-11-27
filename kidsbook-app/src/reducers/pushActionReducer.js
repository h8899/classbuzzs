import {
    SOCKET_PUSHACTIONS,
    UPDATE_ACTION_SUCCESS,
    LOGIN_USER_REQUEST,
    LOGOUT_USER
} from '../actions';
import { mergeObject } from '../utils/utils';

const initialState = {};

export default function(state = initialState, action) {
    switch (action.type) {
        case SOCKET_PUSHACTIONS: {
            const { pushActions } = action.payload;

            const shallowCopy = { ...state };
            return mergeObject(shallowCopy, pushActions);
        }
        case UPDATE_ACTION_SUCCESS: {
            const { actionId, extra, isProcessed } = action.payload;

            let newAction = {};
            if (state[actionId]) newAction = { ...state[actionId ]};
            newAction.extra = extra;
            newAction.isProcessed = isProcessed;

            return {
                ...state,
                [actionId]: newAction
            };
        }
        case LOGIN_USER_REQUEST:
        case LOGOUT_USER:
            return initialState;
        default:
            return state;
    }
}
