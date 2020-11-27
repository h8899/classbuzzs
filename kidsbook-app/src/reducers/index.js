import { combineReducers } from 'redux';
import appReducer from './appReducer';
import authReducer from './authReducer';
import commentReducer from './commentReducer';
import errorReducer from './errorReducer';
import flagReducer from './flagReducer';
import gameReducer from './gameReducer';
import groupReducer from './groupReducer';
import loadingReducer from './loadingReducer';
import postReducer from './postReducer';
import pushActionReducer from './pushActionReducer';
import surveyReducer from './surveyReducer';
import userReducer from './userReducer';

export default combineReducers({
    app: appReducer,
    auth: authReducer,
    comment: commentReducer,
    error: errorReducer,
    flag: flagReducer,
    game: gameReducer,
    group: groupReducer,
    loading: loadingReducer,
    post: postReducer,
    pushAction: pushActionReducer,
    survey: surveyReducer,
    user: userReducer
});
