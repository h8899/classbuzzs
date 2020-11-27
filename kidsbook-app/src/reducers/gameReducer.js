import {
    UPLOAD_GAME_SUCCESS,
    GET_ALL_GAMES_SUCCESS,
    GET_GAME_NEXT_SCENE_SUCCESS,
    UPDATE_GAME_ANSWER_SUCCESS,
    LOGIN_USER_REQUEST,
    LOGOUT_USER,
    GET_GAME_SUCCESS,
    GET_GAME_ANSWER_SUCCESS
} from '../actions';

import { GameFormatter } from '../utils/formatter';

const initialState = {};

export default function(state = initialState, action) {
    switch (action.type) {
        case UPLOAD_GAME_SUCCESS: {
            const { game } = action.payload;

            return {
                ...state,
                [game.id]: GameFormatter.parse(game, state[game.id])
            };
        }
        case GET_ALL_GAMES_SUCCESS: {
            let { games } = action.payload;
            const processed = {};
            if (!Array.isArray(games)) games = [];

            games.forEach((g) => {
                processed[g.id] = GameFormatter.parse(g, state[g.id]);
            });

            return {
                ...state,
                ...processed
            };
        }
        case GET_GAME_NEXT_SCENE_SUCCESS: {
            const { gameId, scene, answers } = action.payload;

            return {
                ...state,
                [gameId]: GameFormatter.parse({ answers: answers }, state[gameId], { sceneAdd: scene })
            };
        }
        case UPDATE_GAME_ANSWER_SUCCESS: {
            const { gameId, answers, ending } = action.payload;

            return {
                ...state,
                [gameId]: GameFormatter.parse({ answers: answers, ending: ending }, state[gameId])
            };
        }
        case GET_GAME_SUCCESS: {
            const { gameId, game } = action.payload;
            const { answers, ...rest } = game;

            return {
                ...state,
                [gameId]: GameFormatter.parse({ ...rest, allAnswers: answers }, state[gameId])
            };
        }
        case GET_GAME_ANSWER_SUCCESS: {
            const { gameId, scenes, answers } = action.payload;

            return {
                ...state,
                [gameId]: GameFormatter.parse({ answers: answers, scenes: scenes }, state[gameId], {
                    sceneReorder: true
                })
            };
        }
        case LOGIN_USER_REQUEST:
        case LOGOUT_USER:
            return initialState;
        default:
            return state;
    }
}
