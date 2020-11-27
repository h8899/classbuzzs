import {
    PUSH_NEW_ACTION_REQUEST,
    PUSH_NEW_ACTION_SUCCESS,
    PUSH_NEW_ACTION_FAILURE,
    UPDATE_ACTION_REQUEST,
    UPDATE_ACTION_SUCCESS,
    UPDATE_ACTION_FAILURE
} from './';
import { ExtensionAPI } from '../apis';
import SnackBarHelper from '../utils/SnackBarHelper';
import { apiDelay } from '../utils/utils';

export function pushNewAction(groupId, payload) {
    return async (dispatch) => {
        dispatch({
            type: PUSH_NEW_ACTION_REQUEST,
            payload: {
                groupId: groupId
            }
        });

        await apiDelay();
        try {
            await ExtensionAPI.pushNewAction(groupId, payload);
        } catch (e) {
            SnackBarHelper.enqueueSnackbar(String(e.message));
            dispatch({
                type: PUSH_NEW_ACTION_FAILURE,
                payload: {
                    groupId: groupId,
                    error: e.message
                }
            });
            return false;
        }

        // TODO: Return the action object
        dispatch({
            type: PUSH_NEW_ACTION_SUCCESS,
            payload: {
                groupId: groupId
            }
        });
        return true;
    };
}

export function updateAction(actionId, extra, isProcessed) {
    return async (dispatch) => {
        dispatch({
            type: UPDATE_ACTION_REQUEST,
            payload: {
                actionId: actionId
            }
        });

        await apiDelay();
        try {
            await ExtensionAPI.updateAction(actionId, extra, isProcessed);
        } catch (e) {
            dispatch({
                type: UPDATE_ACTION_FAILURE,
                payload: {
                    actionId: actionId,
                    error: e.message
                }
            });
            return false;
        }

        dispatch({
            type: UPDATE_ACTION_SUCCESS,
            payload: {
                actionId: actionId,
                extra: extra,
                isProcessed: isProcessed
            }
        });
        return true;
    };
}
