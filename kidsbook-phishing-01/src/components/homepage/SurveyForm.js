import React, { PureComponent } from 'react';
import Img from 'gatsby-image';
import { StaticQuery, graphql } from 'gatsby';
import { Button, Form, FormGroup, Label, Input, FormText } from 'reactstrap';

import './SurveyForm.css';

const disneyFormQuery = graphql`
    query {
        disney2: file(relativePath: { eq: "disney2.jpg" }) {
            childImageSharp {
              fluid(maxWidth: 960) {
                ...GatsbyImageSharpFluid_tracedSVG
              }
            }
        }
    }
`;

class SurveyForm extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            email: '',
            fullname: '',
        };
    }

    render() {
        return (
            <div className="form-container">
                <h4 className="text-center">
                    Disneyland Hong Kong is giving away 100 free tickets to celebrate our 12th anniversary
                </h4>
                <div style={{ maxWidth: '60%', margin: 'auto' }}>
                    <StaticQuery
                        query={disneyFormQuery}
                        render={data => (
                            <Img fluid={data.disney2.childImageSharp.fluid} />
                        )}
                    />
                </div>
                <br />
                <p>
                    With a huge support from the community, we are very pleased to serve you with our best service.
                    Celebrating our 12th year of success, Disneyland Hong Kong is giving away 100 free family tickets for the first 100 responders.
                    <br />
                    Please fill the form below for us to send you the tickets later. Be quick as there is only a limited number of free tickets given away.
                </p>

                <Form>
                    <FormGroup>
                        <Label for="exampleEmail">Email</Label>
                        <Input type="email" name="email" id="exampleEmail" placeholder="with a placeholder" />
                    </FormGroup>
                    <FormGroup>
                        <Label for="examplePassword">Password</Label>
                        <Input type="password" name="password" id="examplePassword" placeholder="password placeholder" />
                    </FormGroup>
                    <FormGroup>
                        <Label for="exampleSelect">Select</Label>
                        <Input type="select" name="select" id="exampleSelect">
                            <option>1</option>
                            <option>2</option>
                            <option>3</option>
                            <option>4</option>
                            <option>5</option>
                        </Input>
                    </FormGroup>
                    <FormGroup>
                        <Label for="exampleSelectMulti">Select Multiple</Label>
                        <Input type="select" name="selectMulti" id="exampleSelectMulti" multiple>
                            <option>1</option>
                            <option>2</option>
                            <option>3</option>
                            <option>4</option>
                            <option>5</option>
                        </Input>
                    </FormGroup>
                    <FormGroup>
                        <Label for="exampleText">Text Area</Label>
                        <Input type="textarea" name="text" id="exampleText" />
                    </FormGroup>
                    <FormGroup>
                        <Label for="exampleFile">File</Label>
                        <Input type="file" name="file" id="exampleFile" />
                        <FormText color="muted">
                            This is some placeholder block-level help text for the above input.
                            It's a bit lighter and easily wraps to a new line.
                        </FormText>
                    </FormGroup>
                    <FormGroup tag="fieldset">
                        <legend>Radio Buttons</legend>
                        <FormGroup check>
                            <Label check>
                                <Input type="radio" name="radio1" />{' '}
                                Option one is this and that—be sure to include why it's great
                            </Label>
                        </FormGroup>
                        <FormGroup check>
                            <Label check>
                                <Input type="radio" name="radio1" />{' '}
                                Option two can be something else and selecting it will deselect option one
                            </Label>
                        </FormGroup>
                        <FormGroup check disabled>
                            <Label check>
                                <Input type="radio" name="radio1" disabled />{' '}
                                Option three is disabled
                            </Label>
                        </FormGroup>
                    </FormGroup>
                    <FormGroup check>
                        <Label check>
                            <Input type="checkbox" />
                            {' '}
                            Check me out
                        </Label>
                    </FormGroup>
                    <Button>Submit</Button>
                </Form>
            </div>
        );
    }
}

export default SurveyForm;
