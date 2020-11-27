import React, { Component } from 'react';
import { Button, Form, FormGroup, Label, Input } from 'reactstrap';

class SurveyForm extends Component {
    constructor(props) {
        super(props);
        this.answerQuestion = this.answerQuestion.bind(this);
        this.renderQuestionType = this.renderQuestionType.bind(this);
        this.answerQuestionCheckbox = this.answerQuestionCheckbox.bind(this);

        // Init an `answers` array on the number of questions
        const { questions } = this.props;
        this.state = {
            answers: Array.from(
                { length: questions.length },
                () => (''),
            ),
            submitted: false,
        };
    }

    answerQuestion = (index, answer) => {
        const { answers } = this.state;
        answers[index] = answer;
        this.setState({
            answers,
        });
    }

    answerQuestionCheckbox = (index, eventOptions) => {
        const { answers } = this.state;
        const selectedOptions = [];
        for (let i = 0, l = eventOptions.length; i < l; i++) {
           if (eventOptions[i].selected) {
             selectedOptions.push(i);
           }
        }
        answers[index] = selectedOptions;
        this.setState({
            answers,
        });
    }

    renderQuestionType = (index, element) => {
        const { type, options } = element;
        if (type === 'text') {
            return (
                <Input
                    type="textarea"
                    name="text"
                    id={`question-${index}`}
                    onChange={(event) => this.answerQuestion(index, event.target.value)}
                />
            );
        }

        if (type === 'option') {
            let curOption = this.state.answers[index];
            if (curOption === '') {
                curOption = 0;
            }
            return (
                <FormGroup>
                    {options.map((option, optIdx) => (
                        <FormGroup check key={`${option}-${optIdx}`}>
                            <Input
                                type="radio"
                                onChange={() => this.answerQuestion(index, optIdx)}
                                checked={curOption === optIdx}
                            />
                            {' '}
                            {option}
                        </FormGroup>
                    ))}
                </FormGroup>
            )
        }

        if (type === 'checkbox') {
            return (
                <Input type="select" multiple onChange={(event) => this.answerQuestionCheckbox(index, event.target.options)}>
                    {options.map((option, idx) => (
                        <option key={idx}>{option}</option>
                    ))}
                </Input>
            );
        }
        return null;
    }

    handleSubmit = async () => {
        const { answers } = this.state;
        const { submitFunc } = this.props;

        const isSuccess = await submitFunc(answers);
        if (isSuccess) {
            this.setState({
                submitted: true,
            });
        } else {
            alert('Please fill in all the required fields');
        }
    }

    render() {
        const { questions } = this.props;
        const { submitted } = this.state;

        if (submitted) {
            return (<h4 className="text-center">Submitted successfully</h4>);
        }

        return (
            <>
                <Form>
                    {questions.map((element, index) => (
                        <FormGroup key={index}>
                            <Label for={`question-${index}`}>{element.question}</Label>
                            {this.renderQuestionType(index, element)}
                        </FormGroup>
                    ))}
                </Form>
                <Button color="primary" onClick={this.handleSubmit}>
                    Submit
                </Button>
            </>
        );
    }
}

export default SurveyForm;
