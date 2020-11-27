import { GET_ALL_FLAGGED_SUCCESS, LOGIN_USER_REQUEST, LOGOUT_USER } from '../actions';
import { FlagFormatter } from '../utils/formatter';

const initialState = {};

export default function(state = initialState, action) {
    switch (action.type) {
        case GET_ALL_FLAGGED_SUCCESS: {
            const { posts, comments } = action.payload;
            const flags = posts.concat(comments);
            const processed = {};

            flags.forEach((f) => {
                processed[f.id] = FlagFormatter.parse(f, state[f.id]);
            });

            return {
                ...state,
                ...processed
            };
        }
        case LOGIN_USER_REQUEST:
        case LOGOUT_USER:
            return initialState;
        default:
            return state;
    }
}
