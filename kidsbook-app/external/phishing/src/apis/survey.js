import jwt from 'jsonwebtoken';
import Axios from './axios';

const getInfo = () => {
    let token = localStorage.getItem('test_effectiveToken');
    let userId = null;

    try {
        token = JSON.parse(token);
        userId = jwt.decode(token).user_id;
    } catch (e) {
        // Ignore
    }

    return {
        userId,
        options: {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
    };
};

class SurveyAPI {
    static async get(surveyId) {
        const info = getInfo();
        const response = await Axios.getInstance().get(`/survey/${surveyId}/`, info.options);
        return {
            survey: response.data.data,
        };
    }

    static async submitAnswers(surveyId, answers) {
        const info = getInfo();
        const { userId } = info;

        const data = new FormData();
        answers.forEach((answer) => {
            data.append('answers', answer);
        });

        try {
            await Axios.getInstance().post(`/survey/${surveyId}/user/${userId}/`, data, info.options);
        } catch (e) {
            return false;
        }
        return true;
    }
}

export default SurveyAPI;
