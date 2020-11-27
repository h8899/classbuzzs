import {
    SOCKET_CONNECT,
    SOCKET_DISCONNECT,
    SOCKET_SUBCRIBE,
    SOCKET_UNSUBSCRIBE
} from './';

export function connectSocket(token, isSuperuser) {
    return async (dispatch) => {
        dispatch({
            type: SOCKET_CONNECT,
            payload: {
                token: token,
                isSuperuser
            }
        });
    };
}

export function disconnectSocket() {
    return async (dispatch) => {
        dispatch({
            type: SOCKET_DISCONNECT,
            payload: {}
        });
    };
}

export function subscribeSocket(groupId) {
    return async (dispatch) => {
        dispatch({
            type: SOCKET_SUBCRIBE,
            payload: {
                groupId: groupId
            }
        });
    };
}

// TODO: Not in use
export function unsubscribeSocket() {
    return async (dispatch) => {
        dispatch({
            type: SOCKET_UNSUBSCRIBE,
            payload: {}
        });
    };
}
