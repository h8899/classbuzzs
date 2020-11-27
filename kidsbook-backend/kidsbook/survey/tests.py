from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from kidsbook.models import Survey, SurveyAnswer, Group
from kidsbook.user.views import generate_token
from kidsbook.serializers import SurveyAnswerSerializer

User = get_user_model()
url_prefix = '/api/v1'

class TestSurvey(APITestCase):
    def setUp(self):
        self.username = "john"
        self.email = "john@snow.com"
        self.password = "you_know_nothing"
        self.superuser = User.objects.create_superuser(username=self.username, email_address=self.email, password=self.password)
        self.superuser_token = self.get_token(self.superuser)

        # User
        self.username = "hey"
        self.email = "kid@s.sss"
        self.password = "want_some_cookies?"
        self.user = User.objects.create_user(username=self.username, email_address=self.email, password=self.password)
        self.user_token = self.get_token(self.user)

        # Another User
        self.username = "123"
        self.email = "dd@s.sss"
        self.password = "want_some_cookies?"
        self.another_user = User.objects.create_user(username=self.username, email_address=self.email, password=self.password)
        self.another_token = self.get_token(self.another_user)

        # Create a group
        response = self.client.post(url_prefix + '/group/', {"name": "testing group"}, HTTP_AUTHORIZATION=self.superuser_token)
        self.group = Group.objects.get(id=response.data.get('data', {})['id'])

        # Url
        self.url = "{}/survey/".format(url_prefix)

    def get_token(self, user):
        token = generate_token(user)
        return 'Bearer {0}'.format(token.decode('utf-8'))

    def test_create_survey(self):
        questions_answers = [
            {
                'question': 'Do you like cats ?',
                'options': ['Yes', 'No', 'May be'],
                'type': 'options'
            },
            {
                'question': 'Do you like dogs ?',
                'options': ['Yes', 'No', 'May be'],
                'type': 'options'
            },
            {
                'question': 'Why ?',
                'type': 'text'
            },
        ]
        response = self.client.post(
            self.url,
            {
                'title': 'a', 'preface': 'b', 'postface': 'c',
                'questions_answers': questions_answers,
                'group': str(self.group.id),
                'is_pinned': True,
            },
            HTTP_AUTHORIZATION=self.superuser_token
        )
        self.assertEqual(202, response.status_code)
        expected_response = {
            'id': response.data.get('data', {}).get('id', ''),
            'creator': self.superuser.id,
            'group': self.group.id,
            'title': 'a', 'preface': 'b', 'postface': 'c',
            'is_pinned': True,
            'stats': {
                'num_of_responses': 0,
                'answers': {
                    '0': [0, 0, 0],
                    '1': [0, 0, 0],
                    '2': []
                }
            },
            'questions_answers': questions_answers
        }
        self.assertEqual(response.data.get('data', {}), expected_response)

    def test_create_survey_with_no_questions(self):
        response = self.client.post(
            self.url,
            {'group': str(self.group.id)},
            HTTP_AUTHORIZATION=self.superuser_token
        )
        self.assertEqual(400, response.status_code)

    def test_create_survey_with_empty_questions(self):
        response = self.client.post(
            self.url,
            {'questions_answers': [], 'group': str(self.group.id)},
            HTTP_AUTHORIZATION=self.superuser_token
        )
        self.assertEqual(400, response.status_code)

    def test_create_survey_with_no_group(self):
        questions_answers = [
            {
                'question': 'Do you like cats ?',
                'options': ['Yes', 'No', 'May be'],
                'type': 'options'
            }
        ]
        response = self.client.post(
            self.url,
            {
                'title': 'a', 'preface': 'b', 'postface': 'c',
                'questions_answers': questions_answers
            },
            HTTP_AUTHORIZATION=self.superuser_token
        )
        self.assertEqual(400, response.status_code)

    def test_create_survey_by_non_superuser(self):
        response = self.client.post(
            self.url,
            {'questions_answers': []},
            HTTP_AUTHORIZATION=self.user_token
        )
        self.assertEqual(403, response.status_code)

    def test_get_all_surveys(self):
        # Create 2 surveys
        self.client.post(
            self.url,
            {'questions_answers': [{'question': '1'}], 'group': str(self.group.id)},
            HTTP_AUTHORIZATION=self.superuser_token
        )
        self.client.post(
            self.url,
            {'questions_answers': [{'question': '2'}], 'group': str(self.group.id)},
            HTTP_AUTHORIZATION=self.superuser_token
        )

        response = self.client.get(
            self.url,
            HTTP_AUTHORIZATION=self.superuser_token
        )
        self.assertEqual(200, response.status_code)
        self.assertEqual(
            2,
            len(response.data.get('data', []))
        )

# Get 1 survey's info

class TestGetSurvey(APITestCase):
    def setUp(self):
        self.username = "john"
        self.email = "john@snow.com"
        self.password = "you_know_nothing"
        self.superuser = User.objects.create_superuser(username=self.username, email_address=self.email, password=self.password)
        self.superuser_token = self.get_token(self.superuser)

        # User
        self.username = "hey"
        self.email = "kid@s.sss"
        self.password = "want_some_cookies?"
        self.user = User.objects.create_user(username=self.username, email_address=self.email, password=self.password)
        self.user_token = self.get_token(self.user)

        # Another User
        self.username = "123"
        self.email = "dd@s.sss"
        self.password = "want_some_cookies?"
        self.another_user = User.objects.create_user(username=self.username, email_address=self.email, password=self.password)
        self.another_token = self.get_token(self.another_user)

        # Create a group
        response = self.client.post(url_prefix + '/group/', {"name": "testing group"}, HTTP_AUTHORIZATION=self.superuser_token)
        self.group = Group.objects.get(id=response.data.get('data', {})['id'])

        # Create a survey
        questions_answers = [
            {
                'question': 'Do you like cats ?',
                'options': ['Yes', 'No', 'May be'],
                'type': 'options'
            },
            {
                'question': 'Do you like dogs ?',
                'options': ['Yes', 'No', 'May be'],
                'type': 'checkbox'
            },
            {
                'question': 'Why ?',
                'type': 'text'
            },
        ]
        response = self.client.post(
            "{}/survey/".format(url_prefix),
            {'questions_answers': questions_answers, 'group': str(self.group.id)},
            HTTP_AUTHORIZATION=self.superuser_token
        )
        self.survey = Survey.objects.get(id=response.data.get('data', {}).get('id', ''))

        # Url
        self.url = "{}/survey/{}/".format(url_prefix, self.survey.id)

        # Create 3 responses
        response = self.client.post(
            '{}user/{}/'.format(self.url, self.superuser.id),
            {
                'answers': [1,[0,1,2], 'Cause I like dogs.']
            },
            HTTP_AUTHORIZATION=self.superuser_token
        )
        self.answer1 = response.data.get('data', {})
        response = self.client.post(
            '{}user/{}/'.format(self.url, self.user.id),
            {
                'answers': [1,[0], 'Cause I like cats.']
            },
            HTTP_AUTHORIZATION=self.user_token
        )
        self.answer2 = response.data.get('data', {})
        response = self.client.post(
            '{}user/{}/'.format(self.url, self.another_user.id),
            {
                'answers': [2,[1,2], 'Cause I like rabbits.']
            },
            HTTP_AUTHORIZATION=self.another_token
        )
        self.answer3 = response.data.get('data', {})

    def get_token(self, user):
        token = generate_token(user)
        return 'Bearer {0}'.format(token.decode('utf-8'))

    def test_get_survey(self):
        response = self.client.get(
            self.url,
            HTTP_AUTHORIZATION=self.superuser_token
        )
        self.assertEqual(200, response.status_code)
        expected_response = {
            'id': str(self.survey.id),
            'creator': self.superuser.id,
            'group': self.group.id,
            'title': '', 'preface': '', 'postface': '',
            'is_pinned': False,
            'stats': {'answers': {'0': [0, 2, 1], '1': [2, 2, 2], '2': []}, 'num_of_responses': 3},
            'questions_answers': [
                {'type': 'options', 'options': ['Yes', 'No', 'May be'], 'question': 'Do you like cats ?'},
                {'type': 'checkbox', 'options': ['Yes', 'No', 'May be'], 'question': 'Do you like dogs ?'},
                {'type': 'text', 'question': 'Why ?'}
            ]
        }
        self.assertEqual(response.data.get('data', {}), expected_response)

    def test_get_survey_by_non_superuser(self):
        response = self.client.get(
            self.url,
            HTTP_AUTHORIZATION=self.user_token
        )
        self.assertEqual(200, response.status_code)
        expected_response = {
            'id': str(self.survey.id),
            'creator': self.superuser.id,
            'group': self.group.id,
            'title': '', 'preface': '', 'postface': '',
            'is_pinned': False,
            'questions_answers': [
                {'type': 'options', 'options': ['Yes', 'No', 'May be'], 'question': 'Do you like cats ?'},
                {'type': 'checkbox', 'options': ['Yes', 'No', 'May be'], 'question': 'Do you like dogs ?'},
                {'type': 'text', 'question': 'Why ?'}]
        }
        self.assertEqual(response.data.get('data', {}), expected_response)

    def test_get_survey_question_by_index(self):
        response = self.client.get(
            "{}?question=1".format(self.url),
            HTTP_AUTHORIZATION=self.superuser_token
        )
        self.assertEqual(200, response.status_code)

        expected_response = {
            'id': str(self.survey.id),
            'creator': self.superuser.id,
            'group': self.group.id,
            'title': '', 'preface': '', 'postface': '',
            'is_pinned': False,
            'stats': {'answers': [2, 2, 2], 'num_of_responses': 3},
            'questions_answers': [
                {'type': 'options', 'options': ['Yes', 'No', 'May be'], 'question': 'Do you like cats ?'},
                {'type': 'checkbox', 'options': ['Yes', 'No', 'May be'], 'question': 'Do you like dogs ?'},
                {'type': 'text', 'question': 'Why ?'}
            ],
            'answers': {
                str(self.superuser.id): '[0, 1, 2]',
                str(self.user.id): '[0]',
                str(self.another_user.id): '[1, 2]'
            }
        }

        self.assertEqual(response.data.get('data', {}), expected_response)

    def test_get_survey_question_by_index_by_non_superuser(self):
        response = self.client.get(
            "{}?question=1".format(self.url),
            HTTP_AUTHORIZATION=self.user_token
        )
        self.assertEqual(200, response.status_code)
        expected_response = {
            'id': str(self.survey.id),
            'creator': self.superuser.id,
            'group': self.group.id,
            'title': '', 'preface': '', 'postface': '',
            'is_pinned': False,
            'questions_answers': [
                {'type': 'options', 'options': ['Yes', 'No', 'May be'], 'question': 'Do you like cats ?'},
                {'type': 'checkbox', 'options': ['Yes', 'No', 'May be'], 'question': 'Do you like dogs ?'},
                {'type': 'text', 'question': 'Why ?'}]
        }
        self.assertEqual(response.data.get('data', {}), expected_response)


# Update survey

class TestUpdateSurvey(APITestCase):
    def setUp(self):
        self.username = "john"
        self.email = "john@snow.com"
        self.password = "you_know_nothing"
        self.superuser = User.objects.create_superuser(username=self.username, email_address=self.email, password=self.password)
        self.superuser_token = self.get_token(self.superuser)

        # User
        self.username = "hey"
        self.email = "kid@s.sss"
        self.password = "want_some_cookies?"
        self.user = User.objects.create_user(username=self.username, email_address=self.email, password=self.password)
        self.user_token = self.get_token(self.user)

        # Another User
        self.username = "123"
        self.email = "dd@s.sss"
        self.password = "want_some_cookies?"
        self.another_user = User.objects.create_user(username=self.username, email_address=self.email, password=self.password)
        self.another_token = self.get_token(self.another_user)

        # Create a group
        response = self.client.post(url_prefix + '/group/', {"name": "testing group"}, HTTP_AUTHORIZATION=self.superuser_token)
        self.group = Group.objects.get(id=response.data.get('data', {})['id'])

        # Create a survey
        self.questions_answers = [
            {
                'question': 'Do you like cats ?',
                'options': ['Yes', 'No', 'May be'],
                'type': 'options'
            },
            {
                'question': 'Do you like dogs ?',
                'options': ['Yes', 'No', 'May be'],
                'type': 'options'
            },
            {
                'question': 'Why ?',
                'type': 'text'
            },
        ]
        response = self.client.post(
            "{}/survey/".format(url_prefix),
            {'questions_answers': self.questions_answers, 'group': str(self.group.id)},
            HTTP_AUTHORIZATION=self.superuser_token
        )
        self.survey = Survey.objects.get(id=response.data.get('data', {}).get('id', ''))

        # Url
        self.url = "{}/survey/{}/".format(url_prefix, self.survey.id)

    def get_token(self, user):
        token = generate_token(user)
        return 'Bearer {0}'.format(token.decode('utf-8'))

    def test_update_survey_info_without_affecting_responses(self):
        # Create a response for survey
        params = {
            'answers': [1,2, 'Cause I like cats.']
        }
        response = self.client.post(
            '{}user/{}/'.format(self.url, self.user.id),
            params,
            HTTP_AUTHORIZATION=self.user_token
        )
        self.assertEqual(202, response.status_code)

        # Update some info
        response = self.client.post(
            self.url,
            {
                'title': 'new_title', 'postface': 'new postface :D',
                'is_pinned': 'true'
            },
            HTTP_AUTHORIZATION=self.superuser_token
        )
        self.assertEqual(202, response.status_code)
        expected_response = {
            'id': response.data.get('data', {}).get('id', ''),
            'creator': self.superuser.id,
            'group': self.group.id,
            'title': 'new_title',
            'preface': '',
            'postface': 'new postface :D',
            'is_pinned': True,
            'stats': {
                'num_of_responses': 1,
                'answers': {
                    '0': [0, 1, 0],
                    '1': [0, 0, 1],
                    '2': []
                }
            },
            'questions_answers': self.questions_answers
        }
        self.assertEqual(response.data.get('data', {}), expected_response)

    def test_update_group_of_survey(self):
        # Create a new group
        response = self.client.post(url_prefix + '/group/', {"name": "testing group2"}, HTTP_AUTHORIZATION=self.superuser_token)
        group = Group.objects.get(id=response.data.get('data', {})['id'])
        response = self.client.post(
            self.url,
            {
                'title': 'new_title', 'postface': 'new postface :D',
                'group': str(group.id),
                'is_pinned': True,
            },
            HTTP_AUTHORIZATION=self.superuser_token
        )
        self.assertEqual(202, response.status_code)
        expected_response = {
            'id': response.data.get('data', {}).get('id', ''),
            'creator': self.superuser.id,
            'group': group.id,
            'title': 'new_title',
            'preface': '',
            'postface': 'new postface :D',
            'is_pinned': True,
            'stats': {
                'num_of_responses': 0,
                'answers': {
                    '0': [0, 0, 0],
                    '1': [0,0,0],
                    '2': [],
                }
            },
            'questions_answers': self.questions_answers
        }
        self.assertEqual(response.data.get('data', {}), expected_response)

    def test_update_questions_of_survey(self):
        new_questions_answers = [
            {
                'question': 'Do you like dogs ?',
                'options': ['Yes', 'No', 'May be'],
                'type': 'options'
            },
            {
                'question': 'Why ?',
                'type': 'text'
            }
        ]
        response = self.client.post(
            self.url,
            {
                'title': 'new_title', 'postface': 'new postface :D',
                'questions_answers': new_questions_answers
            },
            HTTP_AUTHORIZATION=self.superuser_token
        )
        self.assertEqual(202, response.status_code)

        expected_response = {
            'id': response.data.get('data', {}).get('id', ''),
            'creator': self.superuser.id,
            'group': self.group.id,
            'title': 'new_title',
            'preface': '',
            'postface': 'new postface :D',
            'is_pinned': False,
            'stats': {
                'num_of_responses': 0,
                'answers': {
                    '0': [0, 0, 0],
                    '1': []
                }
            },
            'questions_answers': new_questions_answers
        }
        self.assertEqual(response.data.get('data', {}), expected_response)

    def test_update_questions_of_survey_by_non_superuser(self):
        new_questions_answers = [
            {
                'question': 'Do you like dogs ?',
                'options': ['Yes', 'No', 'May be'],
                'type': 'options'
            },
            {
                'question': 'Why ?',
                'type': 'text'
            },
        ]
        response = self.client.post(
            self.url,
            {'questions_answers': new_questions_answers},
            HTTP_AUTHORIZATION=self.user_token
        )
        self.assertEqual(403, response.status_code)

    def test_update_questions_of_survey_have_responses(self):
        # Create a response
        params = {
            'answers': [1,2, 'Cause I like dogs.']
        }
        self.client.post(
            '{}user/{}/'.format(self.url, self.user.id),
            params,
            HTTP_AUTHORIZATION=self.user_token
        )

        # Update survey
        new_questions_answers = [
            {
                'question': 'Why ?',
                'type': 'text'
            },
            {
                'question': 'Do you like cats ?',
                'options': ['Yes', 'No', 'May be'],
                'type': 'options'
            },
        ]
        response = self.client.post(
            self.url,
            {'questions_answers': new_questions_answers},
            HTTP_AUTHORIZATION=self.superuser_token
        )
        self.assertEqual(405, response.status_code)


    def test_delete_survey(self):
        response = self.client.delete(
            self.url,
            HTTP_AUTHORIZATION=self.superuser_token
        )
        self.assertEqual(202, response.status_code)

    def test_delete_survey_by_non_superuser(self):
        response = self.client.delete(
            self.url,
            HTTP_AUTHORIZATION=self.user_token
        )
        self.assertEqual(403, response.status_code)


## survey's answer

class TestSurveyAnswer(APITestCase):
    def setUp(self):
        self.username = "john"
        self.email = "john@snow.com"
        self.password = "you_know_nothing"
        self.superuser = User.objects.create_superuser(username=self.username, email_address=self.email, password=self.password)
        self.superuser_token = self.get_token(self.superuser)

        # User
        self.username = "hey"
        self.email = "kid@s.sss"
        self.password = "want_some_cookies?"
        self.user = User.objects.create_user(username=self.username, email_address=self.email, password=self.password)
        self.user_token = self.get_token(self.user)

        # Another User
        self.username = "123"
        self.email = "dd@s.sss"
        self.password = "want_some_cookies?"
        self.another_user = User.objects.create_user(username=self.username, email_address=self.email, password=self.password)
        self.another_token = self.get_token(self.another_user)

        # Create a group
        response = self.client.post(url_prefix + '/group/', {"name": "testing group"}, HTTP_AUTHORIZATION=self.superuser_token)
        self.group = Group.objects.get(id=response.data.get('data', {})['id'])

        # Create a survey
        questions_answers = [
            {
                'question': 'Do you like cats ?',
                'options': ['Yes', 'No', 'May be'],
                'type': 'options'
            },
            {
                'question': 'Do you like dogs ?',
                'options': ['Yes', 'No', 'May be'],
                'type': 'checkbox'
            },
            {
                'question': 'Why ?',
                'type': 'text'
            },
        ]
        response = self.client.post(
            "{}/survey/".format(url_prefix),
            {'questions_answers': questions_answers, 'group': str(self.group.id)},
            HTTP_AUTHORIZATION=self.superuser_token
        )
        self.survey = response.data['data']

        # Url
        self.url = "{}/survey/{}/".format(url_prefix, self.survey['id'])

    def get_token(self, user):
        token = generate_token(user)
        return 'Bearer {0}'.format(token.decode('utf-8'))

    def test_submit_new_survey_answer(self):
        params = {
            'answers': [1,2, 'Cause I like dogs.']
        }
        response = self.client.post(
            '{}user/{}/'.format(self.url, self.user.id),
            params,
            HTTP_AUTHORIZATION=self.user_token
        )
        self.assertEqual(202, response.status_code)
        self.assertEqual(
            ['1', '2', 'Cause I like dogs.'],
            response.data.get('data', {}).get('answers', [])
        )

        # Check if the stats are updated as expected
        survey = Survey.objects.get(id=self.survey['id'])
        self.assertEqual(
            survey.stats,
            {'answers': {'0': [0, 1, 0], '1': [0, 0, 1], '2': []}, 'num_of_responses': 1}
        )

    def test_submit_new_survey_answer_2(self):
        # Create a survey
        questions_answers = [
            {
                'question': 'Do you like cats ?',
                'type': 'text'
            },
            {
                'question': 'Do you like dogs ?',
                'options': ['Yes', 'No', 'May be'],
                'type': 'checkbox'
            },
            {
                'question': 'Why ?',
                'options': ['Yes', 'No', 'May be'],
                'type': 'radio'
            },
        ]
        response = self.client.post(
            "{}/survey/".format(url_prefix),
            {'questions_answers': questions_answers, 'group': str(self.group.id)},
            HTTP_AUTHORIZATION=self.superuser_token
        )
        survey = response.data['data']
        params = {
            'answers': [3, '', '']
        }
        response = self.client.post(
            '{}/survey/{}/user/{}/'.format(url_prefix, survey['id'], self.user.id),
            params,
            HTTP_AUTHORIZATION=self.user_token
        )
        self.assertEqual(202, response.status_code)
        self.assertEqual(
            ['3', '', ''],
            response.data.get('data', {}).get('answers', [])
        )

        # Check if the stats are updated as expected
        survey = Survey.objects.get(id=survey['id'])
        self.assertEqual(
            survey.stats,
            {'answers': {'0': [], '1': [0, 0, 0], '2': [0, 0, 0]}, 'num_of_responses': 1}
        )

        # Get the new answer
        response = self.client.get(
            '{}/survey/{}/user/{}/'.format(url_prefix, survey.id, self.user.id),
            HTTP_AUTHORIZATION=self.user_token
        )
        self.assertEqual(200, response.status_code)

    def test_submit_new_survey_answer_by_superuser(self):
        params = {
            'answers': [1, [0, 2], 'Cause I like dogs.']
        }
        response = self.client.post(
            '{}user/{}/'.format(self.url, self.user.id),
            params,
            HTTP_AUTHORIZATION=self.superuser_token
        )
        self.assertEqual(202, response.status_code)
        self.assertEqual(
            ['1', '[0, 2]', 'Cause I like dogs.'],
            response.data.get('data', {}).get('answers', [])
        )

        # Check if the stats are updated as expected
        survey = Survey.objects.get(id=self.survey['id'])
        self.assertEqual(
            survey.stats,
            {'answers': {'0': [0, 1, 0], '1': [1, 0, 1], '2': []}, 'num_of_responses': 1}
        )

    def test_submit_new_survey_answer_by_stranger(self):
        params = {
            'answers': [1, [0, 2], 'Cause I like dogs.']
        }
        response = self.client.post(
            '{}user/{}/'.format(self.url, self.user.id),
            params,
            HTTP_AUTHORIZATION=self.another_token
        )
        self.assertEqual(405, response.status_code)

    def test_get_an_answer(self):
        params = {
            'answers': [1, [0, 2], 'Cause I like dogs.']
        }
        self.client.post(
            '{}user/{}/'.format(self.url, self.another_user.id),
            params,
            HTTP_AUTHORIZATION=self.another_token
        )

        response = self.client.get(
            '{}user/{}/'.format(self.url, self.another_user.id),
            HTTP_AUTHORIZATION=self.another_token
        )

        self.assertEqual(200, response.status_code)
        expected_response = {
            'id': response.data.get('data', {}).get('id'),
            'user': self.another_user.id,
            'survey': response.data.get('data', {}).get('survey'),
            'answers': ['1', '[0, 2]', 'Cause I like dogs.']
        }
        self.assertEqual(response.data.get('data', {}), expected_response)

    def test_get_all_answers(self):
        url = "{}answers/".format(self.url)

        # Create 3 answers
        answers1 = self.client.post(
            '{}user/{}/'.format(self.url, self.superuser.id),
            {'answers': [0,1, 'Cause I like dogs.']},
            HTTP_AUTHORIZATION=self.superuser_token
        )
        answers2 = self.client.post(
            '{}user/{}/'.format(self.url, self.user.id),
            {'answers': [1,2, 'Cause I like rice.']},
            HTTP_AUTHORIZATION=self.user_token
        )
        answers3 = self.client.post(
            '{}user/{}/'.format(self.url, self.another_user.id),
            {'answers': [1,1, 'Cause I like cats.']},
            HTTP_AUTHORIZATION=self.another_token
        )

        response = self.client.get(url, HTTP_AUTHORIZATION=self.superuser_token)
        self.assertEqual(200, response.status_code)
        self.assertEqual(3, len(response.data.get('data', [])))
        expected_response = [
            answers1.data.get('data', {}),
            answers2.data.get('data', {}),
            answers3.data.get('data', {}),
        ]
        self.assertEqual(response.data.get('data', {}), expected_response)

    def test_get_all_answers_by_non_superuser(self):
        url = "{}answers/".format(self.url)

        # Create 3 answers
        answers1 = self.client.post(
            '{}user/{}/'.format(self.url, self.superuser.id),
            {'answers': [0,1, 'Cause I like dogs.']},
            HTTP_AUTHORIZATION=self.superuser_token
        )
        answers2 = self.client.post(
            '{}user/{}/'.format(self.url, self.user.id),
            {'answers': [1,2, 'Cause I like rice.']},
            HTTP_AUTHORIZATION=self.user_token
        )
        answers3 = self.client.post(
            '{}user/{}/'.format(self.url, self.another_user.id),
            {'answers': [1,1, 'Cause I like cats.']},
            HTTP_AUTHORIZATION=self.another_token
        )

        response = self.client.get(url, HTTP_AUTHORIZATION=self.user_token)
        self.assertEqual(403, response.status_code)

    def test_delete_all_answers(self):
        url = "{}answers/".format(self.url)

        # Create another survey
        response = self.client.post(
            "{}/survey/".format(url_prefix),
            {'questions_answers': [{'question': '2'}], 'group': str(self.group.id)},
            HTTP_AUTHORIZATION=self.superuser_token
        )
        survey = response.data['data']
        answers_another = self.client.post(
            '{}/survey/{}/user/{}/'.format(url_prefix, survey['id'], self.user.id),
            {'answers': ['Hello']},
            HTTP_AUTHORIZATION=self.user_token
        )

        # Create 3 answers
        answers1 = self.client.post(
            '{}user/{}/'.format(self.url, self.superuser.id),
            {'answers': [0,1, 'Cause I like dogs.']},
            HTTP_AUTHORIZATION=self.superuser_token
        ).data.get('data', {}).get(id)
        answers2 = self.client.post(
            '{}user/{}/'.format(self.url, self.user.id),
            {'answers': [1,2, 'Cause I like rice.']},
            HTTP_AUTHORIZATION=self.user_token
        ).data.get('data', {}).get(id)
        answers3 = self.client.post(
            '{}user/{}/'.format(self.url, self.another_user.id),
            {'answers': [1,1, 'Cause I like cats.']},
            HTTP_AUTHORIZATION=self.another_token
        ).data.get('data', {}).get(id)

        response = self.client.delete(url, HTTP_AUTHORIZATION=self.superuser_token)
        self.assertEqual(202, response.status_code)
        self.assertFalse(SurveyAnswer.objects.filter(survey__id__in=[answers1, answers2, answers3]).exists())
        self.assertEqual(
            1, len(SurveyAnswerSerializer(SurveyAnswer.objects.all(), many=True).data)
        )

        # Get the survey
        url = "{}/survey/{}/".format(url_prefix, self.survey['id'])
        response = self.client.get(url, HTTP_AUTHORIZATION=self.superuser_token)

        # Check if stats is resetted
        survey_questions = self.survey['questions_answers']
        expected_stats = {
            'num_of_responses': 0,
            'answers': {str(index): [0 for _ in question.get('options', [])] for index, question in iter(enumerate(survey_questions))}
        }
        self.assertEqual(
            expected_stats, response.data.get('data', {}).get('stats', {})
        )

    def test_delete_all_answers_by_non_superuser(self):
        url = "{}answers/".format(self.url)

        # Create 3 answers
        answers1 = self.client.post(
            '{}user/{}/'.format(self.url, self.superuser.id),
            {'answers': [0,1, 'Cause I like dogs.']},
            HTTP_AUTHORIZATION=self.superuser_token
        ).data.get('data', {}).get(id)
        answers2 = self.client.post(
            '{}user/{}/'.format(self.url, self.user.id),
            {'answers': [1,2, 'Cause I like rice.']},
            HTTP_AUTHORIZATION=self.user_token
        ).data.get('data', {}).get(id)
        answers3 = self.client.post(
            '{}user/{}/'.format(self.url, self.another_user.id),
            {'answers': [1,1, 'Cause I like cats.']},
            HTTP_AUTHORIZATION=self.another_token
        ).data.get('data', {}).get(id)

        response = self.client.delete(url, HTTP_AUTHORIZATION=self.user_token)
        self.assertEqual(403, response.status_code)

    def test_update_new_answers(self):
        # Create a survey's answer first
        params = {
            'answers': [1, [0, 2], 'Cause I like dogs.']
        }
        self.client.post(
            '{}user/{}/'.format(self.url, self.user.id),
            params,
            HTTP_AUTHORIZATION=self.user_token
        )

        # New answers
        params['answers'] = [0, [1, 2], 'Cause I like dogs.']
        response = self.client.post(
            '{}user/{}/'.format(self.url, self.user.id),
            params,
            HTTP_AUTHORIZATION=self.user_token
        )

        self.assertEqual(202, response.status_code)
        self.assertEqual(
            ['0', '[1, 2]', 'Cause I like dogs.'],
            response.data.get('data', {}).get('answers', [])
        )

        # Check if the stats are updated as expected
        survey = Survey.objects.get(id=self.survey['id'])
        self.assertEqual(
            survey.stats,
            {'answers': {'0': [1, 0, 0], '1': [0, 1, 1], '2': []}, 'num_of_responses': 1}
        )

    def test_submit_answers_without_required_field(self):
        # Create a survey with a required field
        questions_answers = [
            {
                'question': 'Do you like cats ?',
                'options': ['Yes', 'No', 'May be'],
                'type': 'options'
            },
            {
                'question': 'Do you like dogs ?',
                'options': ['Yes', 'No', 'May be'],
                'type': 'checkbox',
                'required': 'true' # Can either be 'true', 'True' (as <String>) or True (as <Boolean>)
            },
            {
                'question': 'Why ?',
                'type': 'text'
            },
        ]
        response = self.client.post(
            "{}/survey/".format(url_prefix),
            {'questions_answers': questions_answers, 'group': str(self.group.id)},
            HTTP_AUTHORIZATION=self.superuser_token
        )
        survey_id = response.data.get('data', {}).get('id', '')
        url = "{}/survey/{}/".format(url_prefix, survey_id)
        params = {
            'answers': [1,'', 'Cause I like dogs.']
        }
        response = self.client.post(
            '{}user/{}/'.format(url, self.user.id),
            params,
            HTTP_AUTHORIZATION=self.user_token
        )
        self.assertEqual(400, response.status_code)

    def test_delete_survey_answer(self):
        params = {
            'answers': [1,2, 'Cause I like dogs.']
        }
        self.client.post(
            '{}user/{}/'.format(self.url, self.user.id),
            params,
            HTTP_AUTHORIZATION=self.user_token
        )
        response = self.client.delete(
            '{}user/{}/'.format(self.url, self.user.id),
            HTTP_AUTHORIZATION=self.user_token
        )
        self.assertEqual(202, response.status_code)

        expected_stats = {
            'num_of_responses': 0,
            'answers': {
                '0': [0, 0, 0],
                '1': [0, 0, 0],
                '2': []
            }
        }
        self.assertEqual(
            Survey.objects.get(id=self.survey['id']).stats,
            expected_stats
        )
