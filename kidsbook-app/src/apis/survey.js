import Axios from './axios';

class SurveyAPI {
    // TODO: group_id instead of by user

    // Create a survey
    static async create(group_id, title, preface, postface, questions) {
        const payload = {
            group: group_id,
            title: title,
            preface: preface,
            postface: postface,
            questions_answers: questions.map((q) => JSON.stringify(q))
        };
        const response = await Axios.getInstance().post('/survey/', payload, {
            headers: { Authorization: 'real' }
        });

        return {
            survey: response.data.data
        };
    }

    // TODO: Wrong file but nevermind
    // Get all surveys in group
    static async getAll(group_id, is_pinned = null, is_completed = null) {
        const queries = [];
        let queryUrl = '';
        if (is_pinned !== null) queries.push(`is_pinned=${String(Boolean(is_pinned))}`);
        if (is_completed !== null) queries.push(`is_completed=${String(Boolean(is_completed))}`);
        if (queries.length > 0) {
            queryUrl = `?${queries.join('&')}`;
        }
        let url = group_id ? `/group/${group_id}` : ``;
        url += `/surveys/${queryUrl}`;

        const response = await Axios.getInstance().get(url, {
            headers: { Authorization: 'real' }
        });

        return {
            surveys: response.data.data
        };
    }

    static async getAllIncomplete() {
        const response = await SurveyAPI.getAll(null, true, false);
        return response;
    }

    // Get a specific survey
    static async get(survey_id) {
        const response = await Axios.getInstance().get(`/survey/${survey_id}/?`, {
            headers: { Authorization: 'real' }
        });
        return {
            survey: response.data.data
        };
    }

    static async update(survey_id, title, preface, postface, questions, is_pinned) {
        const payload = {};
        const isDefined = (a) => (a !== null && a !== undefined);
        if (isDefined(title)) payload.title = String(title);
        if (isDefined(preface)) payload.preface = String(preface);
        if (isDefined(postface)) payload.postface = String(postface);
        if (isDefined(questions)) payload.questions_answers = questions.map((q) => JSON.stringify(q));
        if (isDefined(is_pinned)) payload.is_pinned = String(Boolean(is_pinned));

        const response = await Axios.getInstance().post(`/survey/${survey_id}/`, payload, {
            headers: { Authorization: 'real' }
        });
        return {
            survey: response.data.data
        };
    }

    static async getAnswers(survey_id, user_id) {
        try {
            const response = await Axios.getInstance().get(`/survey/${survey_id}/user/${user_id}/`, {
                headers: { Authorization: 'real' }
            });
            return {
                answer: response.data.data
            };
        } catch (e) {
            // TODO: Quickfix, again :(
            if (e.message === "There are no surveys' responses from this user.") {
                return {
                    answer: null
                };
            } else {
                throw e;
            }
        }
    }

    static async submitAnswers(survey_id, user_id, answers) {
        const payload = {
            answers: answers
        };
        const response = await Axios.getInstance().post(`/survey/${survey_id}/user/${user_id}/`, payload, {
            headers: { Authorization: 'real' }
        });
        return {
            answer: response.data.data
        };
    }

    static async getAllAnswers(survey_id) {
        const response = await Axios.getInstance().get(`/survey/${survey_id}/answers/`, {
            headers: { Authorization: 'real' }
        });
        return {
            answers: response.data.data
        };
    }

    static async clearAllAnswers(survey_id) {
        await Axios.getInstance().delete(`/survey/${survey_id}/answers/`, {
            headers: { Authorization: 'real' }
        });
        return true;
    }

    static async deleteSurvey(survey_id) {
        await Axios.getInstance().delete(`/survey/${survey_id}/`, {
            headers: { Authorization: 'real' }
        });
        return true;
    }
}

export default SurveyAPI;
