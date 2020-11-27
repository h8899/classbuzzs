import { LOGIN_USER_SUCCESS, LOGOUT_USER, GET_ALL_VIRTUAL_SUCCESS, SWITCH_USER_SUCCESS } from '../actions';
import { mergeArray } from '../utils/utils';

const initialState = {
    realToken: null,
    realUser: null,
    effectiveToken: null,
    effectiveUser: null,
    virtualUsers: [],
    _lastValidation: null
};

export default function(state = initialState, action) {
    switch (action.type) {
        case LOGIN_USER_SUCCESS:
            return {
                ...state,
                realUser: action.payload.userId,
                realToken: action.payload.token,
                effectiveUser: action.payload.userId,
                effectiveToken: action.payload.token,
                _lastValidation: Date.now()
            };
        case SWITCH_USER_SUCCESS: {
            return {
                ...state,
                effectiveUser: action.payload.userId,
                effectiveToken: action.payload.userId !== state.realUser ? action.payload.token : state.realToken,
                _lastValidation: Date.now()
            };
        }
        case GET_ALL_VIRTUAL_SUCCESS: {
            const { users } = action.payload;
            const ids = users.map((u) => u.id);

            return {
                ...state,
                virtualUsers: mergeArray(state.virtualUsers, ids)
            };
        }
        case LOGOUT_USER:
            return initialState;
        default:
            return state;
    }
}
