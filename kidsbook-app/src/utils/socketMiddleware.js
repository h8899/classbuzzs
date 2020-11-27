import io from 'socket.io-client';
import isObject from 'is-object';
import Config from '../config';
import {
    SOCKET_CONNECT,
    SOCKET_DISCONNECT,
    SOCKET_SUBCRIBE,
    SOCKET_UNSUBSCRIBE,
    SOCKET_POST_UPDATE,
    SOCKET_PUSHACTIONS
} from '../actions/';
import { PostAPI } from '../apis/';
import { getAllComments } from '../actions/commentActions';

export default function socketMiddleware() {
    let _dispatch;
    let _groupId = null;
    let _token = null;
    let _isSuperuser = false;

    const socket = io(Config.socketUrl, {
        autoConnect: false,
        path: Config.socketPath
    });

    socket.on('post_update', async (update) => {
        if (!isObject(update) || !update.postId || !update.groupId || !update.type) return;
        const { postId, groupId, type } = update;

        let response = {};
        if (type === 'INSERT' || type === 'UPDATE') {
            try {
                response = await PostAPI.get(postId);
            } catch (e) {
                // Ignored
            }
        }

        _dispatch({
            type: SOCKET_POST_UPDATE,
            payload: {
                type: type,
                post: response.post,
                groupId: groupId
            }
        });
    });

    // TODO: Read single comment instead of all comments
    socket.on('comment_update', async (update) => {
        if (!isObject(update) || !update.postId || !update.commentId || !update.type) return;
        const { postId } = update;

        try {
            await getAllComments(postId, _isSuperuser)(_dispatch);
        } catch (e) {
            // Ignored
        }
    });

    socket.on('connect', () => {
        socket.emit('update_subscribe', { groupId: _groupId });
    });

    const handlePushActions = (pushActions) => {
        _dispatch({
            type: SOCKET_PUSHACTIONS,
            payload: {
                pushActions: pushActions
            }
        });
    };
    socket.on('pushactions', handlePushActions);
    socket.on('pushactions_new', handlePushActions);

    return ({ dispatch }) => (next) => (action) => {
        if (!isObject(action) || !String(action.type).startsWith('SOCKET_')) return next(action);

        if (!Config.enableSocket) return next(action);

        _dispatch = dispatch;
        if (!isObject(action.payload)) action.payload = {};

        switch (action.type) {
            case SOCKET_CONNECT:
                _token = action.payload.token;
                _isSuperuser = Boolean(action.payload.isSuperuser);
                socket.io.opts.query = { token: _token };
                socket.connect();
                break;
            case SOCKET_DISCONNECT:
                socket.disconnect();
                break;
            case SOCKET_SUBCRIBE:
                socket.emit('update_subscribe', action.payload);
                _groupId = action.payload.groupId;
                break;
            case SOCKET_UNSUBSCRIBE:
                socket.emit('update_unsubscribe', action.payload);
                break;
            default:
                break;
        }

        next(action);
    };
}
