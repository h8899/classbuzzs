import React, { Component } from 'react';

import Layout from '../components/layout';
import NavbarHeader from '../components/NavbarHeader';
import Container from '../components/Container';
import SurveyForm from '../components/SurveyForm';
import SurveyAPI from '../apis/survey';

import './disney.css';
import disneyImage from '../compressed_images/disney2.jpg';

const getSurveyId = () => {
    const query = window.location.search.substring(1);
    const params = new URLSearchParams(query);
    return params.get('id');
};

class DisneyPage extends Component {
    state = {
        questions: null,
        surveyId: '',
    };

    async componentDidMount() {
        const surveyId = getSurveyId();
        let questions = null;

        try {
            const response = await SurveyAPI.get(surveyId);
            questions = response.survey.questions_answers;
        } catch (e) {
            // Ignore
        }

        this.setState({
            questions,
            surveyId,
        });
    }

    submitSurvey = async (answers) => {
        const { surveyId } = this.state;
        const isSuccess = await SurveyAPI.submitAnswers(surveyId, answers);
        return isSuccess;
    };

    render() {
        const { questions } = this.state;

        return (
            <div className="disney-background">
                <Layout>
                    <NavbarHeader />
                    <Container>
                        <div className="content-container">
                            <h4 className="text-center">
                                Disneyland Hong Kong is giving away 100 free tickets
                                to celebrate our 12th anniversary
                            </h4>
                            <div style={{ maxWidth: '60%', margin: 'auto' }}>
                                <img src={disneyImage} alt="Disney Hong Kong" />
                            </div>
                            <br />
                            <p className="lead">
                                With a huge support from the community,
                                we are very pleased to serve you with our best service.
                                Celebrating our 12th year of success, Disneyland Hong Kong
                                is giving away 100 free family tickets for the first 100 responders.
                                <br />
                                Please fill the form below for us to send you the tickets later.
                                Be quick as there is only a limited number of free tickets given away.
                            </p>
                            <hr style={{ margin: '30px 0' }} />
                            {questions && (
                                <SurveyForm questions={questions} submitFunc={this.submitSurvey} />
                            )}
                        </div>
                    </Container>
                </Layout>
            </div>
        );
    }
}

export default DisneyPage;
