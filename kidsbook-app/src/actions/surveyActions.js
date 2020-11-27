import {
    CREATE_SURVEY_REQUEST,
    CREATE_SURVEY_SUCCESS,
    CREATE_SURVEY_FAILURE,
    GET_ALL_SURVEYS_REQUEST,
    GET_ALL_SURVEYS_SUCCESS,
    GET_ALL_SURVEYS_FAILURE,
    GET_ALL_INCOMPLETE_SURVEYS_REQUEST,
    GET_ALL_INCOMPLETE_SURVEYS_SUCCESS,
    GET_ALL_INCOMPLETE_SURVEYS_FAILURE,
    GET_SURVEY_REQUEST,
    GET_SURVEY_SUCCESS,
    GET_SURVEY_FAILURE,
    GET_SURVEY_ANSWER_REQUEST,
    GET_SURVEY_ANSWER_SUCCESS,
    GET_SURVEY_ANSWER_FAILURE,
    GET_ALL_SURVEY_ANSWER_REQUEST,
    GET_ALL_SURVEY_ANSWER_SUCCESS,
    GET_ALL_SURVEY_ANSWER_FAILURE,
    SUBMIT_SURVEY_ANSWER_REQUEST,
    SUBMIT_SURVEY_ANSWER_SUCCESS,
    SUBMIT_SURVEY_ANSWER_FAILURE,
    CLEAR_ALL_SURVEY_ANSWER_REQUEST,
    CLEAR_ALL_SURVEY_ANSWER_SUCCESS,
    CLEAR_ALL_SURVEY_ANSWER_FAILURE,
    OPEN_INCOMPLETE_SURVEY,
    UPDATE_SURVEY_REQUEST,
    UPDATE_SURVEY_SUCCESS,
    UPDATE_SURVEY_FAILURE,
    DELETE_SURVEY_REQUEST,
    DELETE_SURVEY_SUCCESS,
    DELETE_SURVEY_FAILURE
} from './';
import { SurveyAPI } from '../apis';
import SnackBarHelper from '../utils/SnackBarHelper';
import { apiDelay } from '../utils/utils';

export function createSurvey(group_id, title, preface, postface, questions) {
    return async (dispatch) => {
        dispatch({
            type: CREATE_SURVEY_REQUEST,
            payload: {
                groupId: group_id
            }
        });

        let response;
        await apiDelay();
        try {
            response = await SurveyAPI.create(group_id, title, preface, postface, questions);
        } catch (e) {
            SnackBarHelper.enqueueSnackbar(String(e.message));
            dispatch({
                type: CREATE_SURVEY_FAILURE,
                payload: {
                    groupId: group_id,
                    error: e.message
                }
            });
            return null;
        }

        dispatch({
            type: CREATE_SURVEY_SUCCESS,
            payload: {
                groupId: group_id,
                survey: response.survey
            }
        });
        return response.survey.id;
    };
}

export function getAllSurveys(group_id) {
    return async (dispatch) => {
        dispatch({
            type: GET_ALL_SURVEYS_REQUEST,
            payload: {
                groupId: group_id
            }
        });

        let response;
        await apiDelay();
        try {
            response = await SurveyAPI.getAll(group_id);
        } catch (e) {
            SnackBarHelper.enqueueSnackbar(String(e.message));
            dispatch({
                type: GET_ALL_SURVEYS_FAILURE,
                payload: {
                    groupId: group_id,
                    error: e.message
                }
            });
            return false;
        }

        dispatch({
            type: GET_ALL_SURVEYS_SUCCESS,
            payload: {
                groupId: group_id,
                surveys: response.surveys
            }
        });
        return true;
    };
}

export function getAllIncompleteSurveys() {
    return async (dispatch) => {
        dispatch({
            type: GET_ALL_INCOMPLETE_SURVEYS_REQUEST,
            payload: {}
        });

        let response;
        await apiDelay();
        try {
            response = await SurveyAPI.getAllIncomplete();
        } catch (e) {
            SnackBarHelper.enqueueSnackbar(String(e.message));
            dispatch({
                type: GET_ALL_INCOMPLETE_SURVEYS_FAILURE,
                payload: {
                    error: e.message
                }
            });
            return null;
        }

        dispatch({
            type: GET_ALL_INCOMPLETE_SURVEYS_SUCCESS,
            payload: {
                surveys: response.surveys
            }
        });
        return response.surveys;
    };
}

export function getSurvey(survey_id) {
    return async (dispatch) => {
        dispatch({
            type: GET_SURVEY_REQUEST,
            payload: {
                surveyId: survey_id
            }
        });

        let response;
        await apiDelay();
        try {
            response = await SurveyAPI.get(survey_id);
        } catch (e) {
            dispatch({
                type: GET_SURVEY_FAILURE,
                payload: {
                    error: e.message,
                    surveyId: survey_id
                }
            });
            return null;
        }

        const payload = {
            surveyId: survey_id,
            survey: response.survey
        };
        dispatch({
            type: GET_SURVEY_SUCCESS,
            payload: payload
        });

        return payload;
    };
}

export function getAnswers(survey_id, user_id) {
    return async (dispatch) => {
        dispatch({
            type: GET_SURVEY_ANSWER_REQUEST,
            payload: {
                surveyId: survey_id,
                userId: user_id
            }
        });

        let response;
        await apiDelay();
        try {
            response = await SurveyAPI.getAnswers(survey_id, user_id);
        } catch (e) {
            dispatch({
                type: GET_SURVEY_ANSWER_FAILURE,
                payload: {
                    error: e.message,
                    surveyId: survey_id,
                    userId: user_id
                }
            });
            return false;
        }

        dispatch({
            type: GET_SURVEY_ANSWER_SUCCESS,
            payload: {
                surveyId: survey_id,
                userId: user_id,
                answer: response.answer
            }
        });
        return true;
    };
}

export function getAllAnswers(survey_id) {
    return async (dispatch) => {
        dispatch({
            type: GET_ALL_SURVEY_ANSWER_REQUEST,
            payload: {
                surveyId: survey_id
            }
        });

        let response;
        await apiDelay();
        try {
            response = await SurveyAPI.getAllAnswers(survey_id);
        } catch (e) {
            dispatch({
                type: GET_ALL_SURVEY_ANSWER_FAILURE,
                payload: {
                    error: e.message,
                    surveyId: survey_id
                }
            });
            return null;
        }

        const payload = {
            surveyId: survey_id,
            answers: response.answers
        };
        dispatch({
            type: GET_ALL_SURVEY_ANSWER_SUCCESS,
            payload: payload
        });

        return payload;
    };
}

export function submitAnswers(survey_id, user_id, answers) {
    return async (dispatch) => {
        dispatch({
            type: SUBMIT_SURVEY_ANSWER_REQUEST,
            payload: {
                surveyId: survey_id,
                userId: user_id
            }
        });

        let response;
        await apiDelay();
        try {
            response = await SurveyAPI.submitAnswers(survey_id, user_id, answers);
        } catch (e) {
            SnackBarHelper.enqueueSnackbar(String(e.message));
            dispatch({
                type: SUBMIT_SURVEY_ANSWER_FAILURE,
                payload: {
                    error: e.message,
                    surveyId: survey_id,
                    userId: user_id
                }
            });
            return false;
        }

        dispatch({
            type: SUBMIT_SURVEY_ANSWER_SUCCESS,
            payload: {
                surveyId: survey_id,
                userId: user_id,
                answer: response.answer
            }
        });
        return true;
    };
}

export function clearAllAnswers(survey_id) {
    return async (dispatch) => {
        dispatch({
            type: CLEAR_ALL_SURVEY_ANSWER_REQUEST,
            payload: {
                surveyId: survey_id
            }
        });

        await apiDelay();
        try {
            await SurveyAPI.clearAllAnswers(survey_id);
        } catch (e) {
            SnackBarHelper.enqueueSnackbar(String(e.message));
            dispatch({
                type: CLEAR_ALL_SURVEY_ANSWER_FAILURE,
                payload: {
                    error: e.message,
                    surveyId: survey_id
                }
            });
            return false;
        }

        dispatch({
            type: CLEAR_ALL_SURVEY_ANSWER_SUCCESS,
            payload: {
                surveyId: survey_id
            }
        });
        return true;
    };
}

export function openIncompleteSurvey(survey_id) {
    return async (dispatch) => {
        dispatch({
            type: OPEN_INCOMPLETE_SURVEY,
            payload: {
                surveyId: survey_id
            }
        });
    };
}

export function updateSurvey(survey_id, title, preface, postface, questions, is_pinned) {
    return async (dispatch) => {
        dispatch({
            type: UPDATE_SURVEY_REQUEST,
            payload: {
                surveyId: survey_id
            }
        });

        let response;
        await apiDelay();
        try {
            response = await SurveyAPI.update(survey_id, title, preface, postface, questions, is_pinned);
        } catch (e) {
            SnackBarHelper.enqueueSnackbar(String(e.message));
            dispatch({
                type: UPDATE_SURVEY_FAILURE,
                payload: {
                    surveyId: survey_id,
                    error: e.message
                }
            });
            return null;
        }

        dispatch({
            type: UPDATE_SURVEY_SUCCESS,
            payload: {
                survey: response.survey,
                surveyId: survey_id
            }
        });
        return survey_id;
    };
}

export function deleteSurvey(survey_id) {
    return async (dispatch) => {
        dispatch({
            type: DELETE_SURVEY_REQUEST,
            payload: {
                surveyId: survey_id
            }
        });

        await apiDelay();
        try {
            await SurveyAPI.deleteSurvey(survey_id);
        } catch (e) {
            SnackBarHelper.enqueueSnackbar(String(e.message));
            dispatch({
                type: DELETE_SURVEY_FAILURE,
                payload: {
                    error: e.message,
                    surveyId: survey_id
                }
            });
            return false;
        }

        dispatch({
            type: DELETE_SURVEY_SUCCESS,
            payload: {
                surveyId: survey_id
            }
        });
        return true;
    };
}
