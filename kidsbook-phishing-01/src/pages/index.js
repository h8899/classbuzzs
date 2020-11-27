import React from 'react';

import Layout from '../components/layout';
import SEO from '../components/seo';
import NavbarHeader from '../components/NavbarHeader';
import Container from '../components/Container';
import SurveyForm from '../components/homepage/SurveyForm';

import './index.css';

const IndexPage = () => (
    <div className="index-background">
      <Layout>
        <SEO title="Home" keywords={['gatsby', 'application', 'react']} />
        <NavbarHeader />
        <Container>
            <SurveyForm />
        </Container>
      </Layout>
    </div>
);

export default IndexPage;
