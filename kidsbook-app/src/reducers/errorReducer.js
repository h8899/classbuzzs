import { LOGIN_USER_REQUEST, LOGOUT_USER, FETCH_COMMENTS, CREATE_COMMENT } from '../actions/';

const initialState = {
    [FETCH_COMMENTS]: {},
    [CREATE_COMMENT]: {}
};

export default function(state = initialState, action) {
    if (action === LOGIN_USER_REQUEST || action === LOGOUT_USER) {
        return initialState;
    }

    const { type, payload } = action;
    const matches = /(.*)_(REQUEST|FAILURE)/.exec(type);

    // Not a *_REQUEST / *_FAILURE actions, so we ignore them
    if (!matches) return state;

    const [, requestName, requestState] = matches;
    let result = requestState === 'FAILURE' ? payload.error : null;

    if (requestName === FETCH_COMMENTS) {
        result = {
            ...state[FETCH_COMMENTS],
            [payload.postId]: result
        };
    } else if (requestName === CREATE_COMMENT) {
        result = {
            ...state[CREATE_COMMENT],
            [payload.postId]: result
        };
    }

    return {
        ...state,
        [requestName]: result
    };
}
