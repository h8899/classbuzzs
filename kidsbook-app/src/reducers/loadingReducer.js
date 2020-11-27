import {
    FETCH_COMMENTS,
    GET_USER,
    FETCH_POSTS,
    GET_ALL_MEMBERS,
    GET_ALL_ANY_MEMBERS,
    LOGIN_USER_REQUEST,
    LOGOUT_USER,
    GET_POST,
    CREATE_COMMENT,
    GET_SURVEY,
    GET_SURVEY_ANSWER
} from '../actions/';

const initialState = {
    [FETCH_COMMENTS]: {},
    [GET_USER]: {},
    [FETCH_POSTS]: {},
    [GET_ALL_MEMBERS]: {},
    [GET_ALL_ANY_MEMBERS]: {},
    [GET_POST]: {},
    [CREATE_COMMENT]: {},
    [GET_SURVEY]: {},
    [GET_SURVEY_ANSWER]: {}
};

export default function(state = initialState, action) {
    if (action === LOGIN_USER_REQUEST || action === LOGOUT_USER) {
        return initialState;
    }

    const { type, payload } = action;
    const matches = /(.*)_(REQUEST|SUCCESS|FAILURE)/.exec(type);

    // Not a *_REQUEST / *_SUCCESS /  *_FAILURE actions, so we ignore them
    if (!matches) return state;

    const [, requestName, requestState] = matches;
    let result = requestState === 'REQUEST';

    if (requestName === FETCH_COMMENTS) {
        result = {
            ...state[FETCH_COMMENTS],
            [payload.postId]: result
        };
    } else if (requestName === GET_USER) {
        result = {
            ...state[GET_USER],
            [payload.userId]: result
        };
    } else if (requestName === FETCH_POSTS) {
        result = {
            ...state[FETCH_POSTS],
            [payload.groupId]: result
        };
    } else if (requestName === GET_ALL_MEMBERS) {
        result = {
            ...state[GET_ALL_MEMBERS],
            [payload.groupId]: result
        };
    } else if (requestName === GET_ALL_ANY_MEMBERS) {
        result = {
            ...state[GET_ALL_ANY_MEMBERS],
            [payload.userId]: result
        };
    } else if (requestName === GET_POST) {
        result = {
            ...state[GET_POST],
            [payload.postId]: result
        };
    } else if (requestName === CREATE_COMMENT) {
        result = {
            ...state[CREATE_COMMENT],
            [payload.postId]: result
        };
    } else if (requestName === GET_SURVEY) {
        result = {
            ...state[GET_SURVEY],
            [payload.surveyId]: result
        };
    } else if (requestName === GET_SURVEY_ANSWER) {
        result = {
            ...state[GET_SURVEY_ANSWER],
            [payload.surveyId]: result
        };
    }

    // Store whether a request is happening at the moment or not
    return {
        ...state,
        [requestName]: result
    };
}
