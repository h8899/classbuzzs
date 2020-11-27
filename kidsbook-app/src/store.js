// React
import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import rootReducer from './reducers';
import { connectRouter, routerMiddleware } from 'connected-react-router';
import { createTransform, persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // Defaults to localStorage for web and AsyncStorage for react-native
import isObject from 'is-object';

// Project
import history from './history';
import socketMiddleware from './utils/socketMiddleware';
import {
    PostFormatter,
    CommentFormatter,
    UserFormatter,
    NotificationFormatter,
    GroupFormatter,
    SurveyFormatter,
    GameFormatter
} from './utils/formatter';

const persistConfig = {
    key: 'dev_kidsbook',
    storage,
    blacklist: ['error', 'loading'],
    transforms: [
        createTransform(
            (state) => state,
            (state, key) => {
                state = { ...state };
                switch (key) {
                    case 'app': {
                        if (!isObject(state.notification)) state.notification = {};
                        const { notification } = state;

                        if (!Array.isArray(notification.notifications)) {
                            notification.notifications = [];
                        } else {
                            notification.notifications = notification.notifications.map((n) =>
                                NotificationFormatter.show(n)
                            );
                        }
                        break;
                    }
                    case 'auth': {
                        if (!Array.isArray(state.virtualUsers)) {
                            state.virtualUsers = [];
                        }
                        break;
                    }
                    case 'post': {
                        Object.keys(state).forEach((k) => {
                            state[k] = PostFormatter.show(state[k]);
                        });
                        break;
                    }
                    case 'comment': {
                        Object.keys(state).forEach((k) => {
                            state[k] = CommentFormatter.show(state[k]);
                        });
                        break;
                    }
                    case 'user': {
                        Object.keys(state).forEach((k) => {
                            state[k] = UserFormatter.show(state[k]);
                        });
                        break;
                    }
                    case 'group': {
                        Object.keys(state).forEach((k) => {
                            state[k] = GroupFormatter.show(state[k]);
                        });
                        break;
                    }
                    case 'survey': {
                        Object.keys(state).forEach((k) => {
                            state[k] = SurveyFormatter.show(state[k]);
                        });
                        break;
                    }
                    case 'game': {
                        Object.keys(state).forEach((k) => {
                            state[k] = GameFormatter.show(state[k]);
                        });
                        break;
                    }
                    default:
                        break;
                }
                return state;
            },
            {}
        )
    ]
};
const initialState = {};
const middlewares = [thunk, routerMiddleware(history), socketMiddleware()];

const myStore = createStore(
    connectRouter(history)(persistReducer(persistConfig, rootReducer)),
    initialState,
    compose(
        applyMiddleware(...middlewares),
        ...(window.__REDUX_DEVTOOLS_EXTENSION__ ? [window.__REDUX_DEVTOOLS_EXTENSION__()] : [])
    )
);

export const store = myStore;
export const persistor = persistStore(store);
