from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from kidsbook.models import Group, Survey
from kidsbook.user.views import generate_token

User = get_user_model()
url_prefix = '/api/v1'

class TestGroupSurvey(APITestCase):
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
        self.group.add_member(self.user)

        # Create 3 surveys
        response = self.client.post(
            "{}/survey/".format(url_prefix),
            {'questions_answers': [{'question': '1'}], 'group': str(self.group.id), 'is_pinned': 'true'},
            HTTP_AUTHORIZATION=self.superuser_token
        )
        self.survey1 = Survey.objects.get(id=response.data.get('data', {}).get('id'))
        response = self.client.post(
            "{}/survey/".format(url_prefix),
            {'questions_answers': [{'question': '2'}], 'group': str(self.group.id)},
            HTTP_AUTHORIZATION=self.superuser_token
        )
        self.survey2 = Survey.objects.get(id=response.data.get('data', {}).get('id'))
        response = self.client.post(
            "{}/survey/".format(url_prefix),
            {'questions_answers': [{'question': '3'}], 'group': str(self.group.id)},
            HTTP_AUTHORIZATION=self.superuser_token
        )
        self.survey3 = Survey.objects.get(id=response.data.get('data', {}).get('id'))

        self.url1 = "{}/survey/{}/".format(url_prefix, self.survey1.id)
        self.url2 = "{}/survey/{}/".format(url_prefix, self.survey2.id)
        self.url3 = "{}/survey/{}/".format(url_prefix, self.survey3.id)

        # Url
        self.url = "{}/group/{}/surveys/".format(url_prefix, self.group.id)

    def get_token(self, user):
        token = generate_token(user)
        return 'Bearer {0}'.format(token.decode('utf-8'))

    def test_get_all_surveys_in_group(self):
        response = self.client.get(self.url, HTTP_AUTHORIZATION=self.superuser_token)
        self.assertEqual(200, response.status_code)
        self.assertEqual(3, len(response.data.get('data', [])))

    def test_get_all_surveys_in_group_by_non_superuser(self):
        response = self.client.get(self.url, HTTP_AUTHORIZATION=self.user_token)
        self.assertEqual(200, response.status_code)
        self.assertEqual(3, len(response.data.get('data', [])))

    def test_get_all_surveys_in_group_by_non_group_user(self):
        response = self.client.get(self.url, HTTP_AUTHORIZATION=self.another_token)
        self.assertEqual(403, response.status_code)

    def test_get_all_pinned_true_surveys(self):
        url = "{}?is_pinned=true".format(self.url)
        response = self.client.get(url, HTTP_AUTHORIZATION=self.superuser_token)
        self.assertEqual(200, response.status_code)
        self.assertEqual(1, len(response.data.get('data', [])))
        self.assertEqual(
            str(self.survey1.id),
            response.data.get('data', [])[0].get('id', '')
        )

    def test_get_all_pinned_false_surveys(self):
        url = "{}?is_pinned=false".format(self.url)
        response = self.client.get(url, HTTP_AUTHORIZATION=self.superuser_token)
        self.assertEqual(200, response.status_code)
        self.assertEqual(2, len(response.data.get('data', [])))

        survey_ids = [survey.get('id', '') for survey in response.data.get('data', [])]
        self.assertTrue(
            str(self.survey2.id) in survey_ids and str(self.survey3.id) in survey_ids
        )

    def test_get_all_completed_surveys(self):
        # Create 2 responses for survey 1 and 2
        answers1 = self.client.post(
            '{}user/{}/'.format(self.url1, self.superuser.id),
            {'answers': [0]},
            HTTP_AUTHORIZATION=self.superuser_token
        ).data.get('data', {}).get(id)
        answers2 = self.client.post(
            '{}user/{}/'.format(self.url2, self.superuser.id),
            {'answers': [1]},
            HTTP_AUTHORIZATION=self.superuser_token
        ).data.get('data', {}).get(id)

        url = "{}?is_completed=true".format(self.url)
        response = self.client.get(url, HTTP_AUTHORIZATION=self.superuser_token)
        self.assertEqual(200, response.status_code)
        self.assertEqual(2, len(response.data.get('data', [])))
        survey_ids = [survey.get('id', '') for survey in response.data.get('data', [])]
        self.assertTrue(
            str(self.survey1.id) in survey_ids and str(self.survey2.id) in survey_ids
        )

    def test_get_all_completed_surveys_by_non_superuser(self):
        # Create 2 responses for survey 1
        self.client.post(
            '{}user/{}/'.format(self.url1, self.user.id),
            {'answers': [0]},
            HTTP_AUTHORIZATION=self.user_token
        )
        self.client.post(
            '{}user/{}/'.format(self.url2, self.user.id),
            {'answers': [1]},
            HTTP_AUTHORIZATION=self.user_token
        )

        url = "{}?is_completed=true".format(self.url)
        response = self.client.get(url, HTTP_AUTHORIZATION=self.user_token)
        self.assertEqual(200, response.status_code)
        self.assertEqual(2, len(response.data.get('data', [])))
        survey_ids = [survey.get('id', '') for survey in response.data.get('data', [])]
        self.assertTrue(
            str(self.survey1.id) in survey_ids and str(self.survey2.id) in survey_ids
        )

    def test_get_all_pinned_true_and_completed_false_surveys(self):
        # Create 2 responses for survey 2 and 3
        self.client.post(
            '{}user/{}/'.format(self.url2, self.user.id),
            {'answers': [0]},
            HTTP_AUTHORIZATION=self.superuser_token
        )
        self.client.post(
            '{}user/{}/'.format(self.url3, self.user.id),
            {'answers': [1]},
            HTTP_AUTHORIZATION=self.superuser_token
        )
        url = "{}?is_pinned=true&is_completed=false".format(self.url)
        response = self.client.get(url, HTTP_AUTHORIZATION=self.user_token)
        self.assertEqual(200, response.status_code)
        self.assertEqual(1, len(response.data.get('data', [])))
        self.assertEqual(
            str(self.survey1.id),
            response.data.get('data', [])[0].get('id', '')
        )

    def test_get_all_pinned_true_and_completed_true_surveys(self):
        # Create 2 responses for survey 2 and 3
        self.client.post(
            '{}user/{}/'.format(self.url2, self.user.id),
            {'answers': [0]},
            HTTP_AUTHORIZATION=self.superuser_token
        )
        self.client.post(
            '{}user/{}/'.format(self.url3, self.user.id),
            {'answers': [1]},
            HTTP_AUTHORIZATION=self.superuser_token
        )
        url = "{}?is_pinned=true&is_completed=true".format(self.url)
        response = self.client.get(url, HTTP_AUTHORIZATION=self.user_token)
        self.assertEqual(200, response.status_code)
        self.assertEqual(0, len(response.data.get('data', [])))

    def test_get_all_pinned_false_and_completed_true_surveys(self):
        # Create 2 responses for survey 2 and 3
        self.client.post(
            '{}user/{}/'.format(self.url2, self.user.id),
            {'answers': [0]},
            HTTP_AUTHORIZATION=self.superuser_token
        )
        self.client.post(
            '{}user/{}/'.format(self.url3, self.user.id),
            {'answers': [1]},
            HTTP_AUTHORIZATION=self.superuser_token
        )
        url = "{}?is_pinned=false&is_completed=true".format(self.url)
        response = self.client.get(url, HTTP_AUTHORIZATION=self.user_token)
        self.assertEqual(200, response.status_code)
        self.assertEqual(2, len(response.data.get('data', [])))
        survey_ids = [survey.get('id', '') for survey in response.data.get('data', [])]
        self.assertTrue(
            str(self.survey2.id) in survey_ids and str(self.survey3.id) in survey_ids
        )

    def test_get_all_pinned_false_and_completed_false_surveys(self):
        # Create 2 responses for survey 2 and 3
        self.client.post(
            '{}user/{}/'.format(self.url2, self.user.id),
            {'answers': [0]},
            HTTP_AUTHORIZATION=self.superuser_token
        )
        self.client.post(
            '{}user/{}/'.format(self.url3, self.user.id),
            {'answers': [1]},
            HTTP_AUTHORIZATION=self.superuser_token
        )
        url = "{}?is_pinned=false&is_completed=false".format(self.url)
        response = self.client.get(url, HTTP_AUTHORIZATION=self.user_token)
        self.assertEqual(200, response.status_code)
        self.assertEqual(0, len(response.data.get('data', [])))
