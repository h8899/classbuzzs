import {
    GET_ALL_SURVEYS_SUCCESS,
    GET_ALL_INCOMPLETE_SURVEYS_SUCCESS,
    OPEN_INCOMPLETE_SURVEY,
    CREATE_SURVEY_SUCCESS,
    GET_SURVEY_SUCCESS,
    GET_SURVEY_ANSWER_SUCCESS,
    CLEAR_ALL_SURVEY_ANSWER_SUCCESS,
    GET_ALL_SURVEY_ANSWER_SUCCESS,
    SUBMIT_SURVEY_ANSWER_SUCCESS,
    UPDATE_SURVEY_SUCCESS,
    LOGIN_USER_REQUEST,
    LOGOUT_USER
} from '../actions';

import isObject from 'is-object';
import { SurveyFormatter } from '../utils/formatter';

const initialState = {};

export default function(state = initialState, action) {
    switch (action.type) {
        case GET_ALL_SURVEYS_SUCCESS:
        case GET_ALL_INCOMPLETE_SURVEYS_SUCCESS: {
            let { surveys } = action.payload;
            const processed = {};
            if (!Array.isArray(surveys)) surveys = [];

            let extra = {};
            if (action.type === GET_ALL_INCOMPLETE_SURVEYS_SUCCESS) {
                extra.incomplete = true;
            }

            surveys.forEach((s) => {
                processed[s.id] = SurveyFormatter.parse(s, state[s.id], extra);
            });

            return {
                ...state,
                ...processed
            };
        }
        case OPEN_INCOMPLETE_SURVEY: {
            const { surveyId } = action.payload;
            return {
                ...state,
                [surveyId]: SurveyFormatter.parse(null, state[surveyId], { incomplete: false })
            };
        }
        case CREATE_SURVEY_SUCCESS:
        case GET_SURVEY_SUCCESS:
        case UPDATE_SURVEY_SUCCESS: {
            const { survey } = action.payload;
            if (!isObject(survey)) return state;

            return {
                ...state,
                [survey.id]: SurveyFormatter.parse(survey, state[survey.id])
            };
        }
        case GET_SURVEY_ANSWER_SUCCESS:
        case SUBMIT_SURVEY_ANSWER_SUCCESS: {
            const { surveyId, answer } = action.payload;
            if (!surveyId) return state;

            return {
                ...state,
                [surveyId]: SurveyFormatter.parse(null, state[surveyId], { answerAdd: answer })
            };
        }
        case CLEAR_ALL_SURVEY_ANSWER_SUCCESS: {
            const { surveyId } = action.payload;
            if (!surveyId) return state;

            const patch = {
                stats: {
                    num_of_responses: 0
                }
            };

            return {
                ...state,
                [surveyId]: SurveyFormatter.parse(patch, state[surveyId], { answerClear: true })
            };
        }
        case GET_ALL_SURVEY_ANSWER_SUCCESS: {
            const { surveyId, answers } = action.payload;
            if (!surveyId) return state;

            return {
                ...state,
                [surveyId]: SurveyFormatter.parse({ answers }, state[surveyId])
            };
        }
        case LOGIN_USER_REQUEST:
        case LOGOUT_USER:
            return initialState;
        default:
            return state;
    }
}
