import {
    UPLOAD_GAME_REQUEST,
    UPLOAD_GAME_SUCCESS,
    UPLOAD_GAME_FAILURE,
    GET_ALL_GAMES_REQUEST,
    GET_ALL_GAMES_SUCCESS,
    GET_ALL_GAMES_FAILURE,
    GET_GAME_NEXT_SCENE_REQUEST,
    GET_GAME_NEXT_SCENE_SUCCESS,
    GET_GAME_NEXT_SCENE_FAILURE,
    UPDATE_GAME_ANSWER_REQUEST,
    UPDATE_GAME_ANSWER_SUCCESS,
    UPDATE_GAME_ANSWER_FAILURE,
    GET_GAME_REQUEST,
    GET_GAME_SUCCESS,
    GET_GAME_FAILURE,
    GET_GAME_ANSWER_REQUEST,
    GET_GAME_ANSWER_SUCCESS,
    GET_GAME_ANSWER_FAILURE,
    DELETE_GAME_REQUEST,
    DELETE_GAME_SUCCESS,
    DELETE_GAME_FAILURE
} from './';
import { GameAPI } from '../apis';
import SnackBarHelper from '../utils/SnackBarHelper';
import { apiDelay } from '../utils/utils';

export function uploadGame(groupId, file, title, preface, threshold) {
    return async (dispatch) => {
        dispatch({
            type: UPLOAD_GAME_REQUEST,
            payload: {
                groupId: groupId
            }
        });

        let response;
        await apiDelay();
        try {
            response = await GameAPI.upload(groupId, file, title, preface, threshold);
        } catch (e) {
            SnackBarHelper.enqueueSnackbar(String(e.message));
            dispatch({
                type: UPLOAD_GAME_FAILURE,
                payload: {
                    groupId: groupId,
                    error: e.message
                }
            });
            return false;
        }

        dispatch({
            type: UPLOAD_GAME_SUCCESS,
            payload: {
                groupId: groupId,
                game: response.game
            }
        });
        return true;
    };
}

export function getAllGames(groupId) {
    return async (dispatch) => {
        dispatch({
            type: GET_ALL_GAMES_REQUEST,
            payload: {
                groupId: groupId
            }
        });

        let response;
        await apiDelay();
        try {
            response = await GameAPI.getAll(groupId);
        } catch (e) {
            SnackBarHelper.enqueueSnackbar(String(e.message));
            dispatch({
                type: GET_ALL_GAMES_FAILURE,
                payload: {
                    groupId: groupId,
                    error: e.message
                }
            });
            return false;
        }

        dispatch({
            type: GET_ALL_GAMES_SUCCESS,
            payload: {
                groupId: groupId,
                games: response.games
            }
        });
        return true;
    };
}

export function getGameNextScene(gameId) {
    return async (dispatch) => {
        dispatch({
            type: GET_GAME_NEXT_SCENE_REQUEST,
            payload: {
                gameId: gameId
            }
        });

        let response;
        await apiDelay();
        try {
            response = await GameAPI.getNextScene(gameId);
        } catch (e) {
            SnackBarHelper.enqueueSnackbar(String(e.message));
            dispatch({
                type: GET_GAME_NEXT_SCENE_FAILURE,
                payload: {
                    gameId: gameId,
                    error: e.message
                }
            });
            return false;
        }

        dispatch({
            type: GET_GAME_NEXT_SCENE_SUCCESS,
            payload: {
                gameId: gameId,
                scene: response.scene,
                answers: response.answers
            }
        });
        return true;
    };
}

export function updateGameAnswer(gameId, userId, answers) {
    return async (dispatch) => {
        dispatch({
            type: UPDATE_GAME_ANSWER_REQUEST,
            payload: {
                gameId: gameId,
                userId: userId
            }
        });

        let response;
        await apiDelay();
        try {
            response = await GameAPI.updateAnswer(gameId, userId, answers);
        } catch (e) {
            SnackBarHelper.enqueueSnackbar(String(e.message));
            dispatch({
                type: UPDATE_GAME_ANSWER_FAILURE,
                payload: {
                    gameId: gameId,
                    userId: userId,
                    error: e.message
                }
            });
            return null;
        }

        dispatch({
            type: UPDATE_GAME_ANSWER_SUCCESS,
            payload: {
                gameId: gameId,
                userId: userId,
                answers: response.answers,
                ending: response.ending
            }
        });
        return {
            ending: response.ending
        };
    };
}

export function getGame(gameId) {
    return async (dispatch) => {
        dispatch({
            type: GET_GAME_REQUEST,
            payload: {
                gameId: gameId
            }
        });

        let response;
        await apiDelay();
        try {
            response = await GameAPI.get(gameId);
        } catch (e) {
            SnackBarHelper.enqueueSnackbar(String(e.message));
            dispatch({
                type: GET_GAME_FAILURE,
                payload: {
                    gameId: gameId,
                    error: e.message
                }
            });
            return false;
        }

        dispatch({
            type: GET_GAME_SUCCESS,
            payload: {
                gameId: gameId,
                game: response.game
            }
        });
        return true;
    };
}

export function getGameAnswer(gameId, userId) {
    return async (dispatch) => {
        dispatch({
            type: GET_GAME_ANSWER_REQUEST,
            payload: {
                gameId: gameId,
                userId: userId
            }
        });

        let response;
        await apiDelay();
        try {
            response = await GameAPI.getAnswer(gameId, userId);
        } catch (e) {
            dispatch({
                type: GET_GAME_ANSWER_FAILURE,
                payload: {
                    gameId: gameId,
                    userId: userId,
                    error: e.message
                }
            });
            return false;
        }

        dispatch({
            type: GET_GAME_ANSWER_SUCCESS,
            payload: {
                gameId: gameId,
                userId: userId,
                scenes: response.scenes,
                answers: response.answers
            }
        });
        return true;
    };
}

export function deleteGame(gameId) {
    return async (dispatch) => {
        dispatch({
            type: DELETE_GAME_REQUEST,
            payload: {
                gameId: gameId
            }
        });

        await apiDelay();
        try {
            await GameAPI.deleteGame(gameId);
        } catch (e) {
            SnackBarHelper.enqueueSnackbar(String(e.message));
            dispatch({
                type: DELETE_GAME_FAILURE,
                payload: {
                    error: e.message,
                    gameId: gameId
                }
            });
            return false;
        }

        dispatch({
            type: DELETE_GAME_SUCCESS,
            payload: {
                gameId: gameId
            }
        });
        return true;
    };
}
