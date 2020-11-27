from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from kidsbook.user.views import generate_token
from json import loads, dumps

User = get_user_model()
url_prefix = "/api/v1"


class TestSLS(APITestCase):
    def setUp(self):
        self.url = url_prefix + "/group/"
        self.username = "john"
        self.email = "john@snow.com"
        self.password = "you_know_nothing"
        self.user = User.objects.create_superuser(
            username=self.username, email_address=self.email, password=self.password
        )
        self.token = self.get_token(self.user)

        # User
        self.username = "hey"
        realname = "TESTER 107"
        self.email = ""
        self.password = "want_some_cookies?"
        self.user = User.objects.create_user(
            username=self.username,
            email_address=self.email,
            password=self.password,
            realname=realname,
        )
        self.user_token = self.get_token(self.user)

        self.sls_user_id = "04dd6d77-1121-4a74-9499-f22fa924f3ce"
        self.sls_teacher_id = "e37a72e6-bfcc-4d7f-9a41-e556ccf67348"

        # Group Creator Bot
        User.objects.create_superuser(
            email_address="i_am_a_creator_group_robot",
            username="group_creator_bot",
            password="a",
            realname="Group Creator Bot",
        )

    def get_token(self, user):
        token = generate_token(user)
        return "Bearer {0}".format(token.decode("utf-8"))

    def test_login_a_sls_student(self):
        url = "{}/sls/login/".format(url_prefix)
        body = {"user-id": self.sls_user_id}
        response = self.client.post(url, body)
        self.assertEqual(response.status_code, 200)
        self.assertTrue("user" in response.json().get("data", {}))
        self.assertTrue("token" in response.json().get("data", {}))

        expected_user_json = {
            "sls_id": "04dd6d77-1121-4a74-9499-f22fa924f3ce",
            "realname": "TESTER 107",
            "username": "04dd6d77-1121-4a74-9499-f22fa924f3ce",
            "is_superuser": False,
            "email_address": "04dd6d77-1121-4a74-9499-f22fa924f3ce",
        }
        user_data = response.json().get("data", {}).get("user", {})
        for key, val in expected_user_json.items():
            self.assertTrue(user_data.get(key, "") == val)
        self.assertEqual(len(User.objects.all()), 4)

        # Check if the groups the user in are created
        expected_group_names = [
            "SE1-MATHS-1 MATHEMATICS",
            "SE1-SCI-1 SCIENCE",
            "SE1-CH(SS,HE)-1 COMBINED HUMANITIES (S,H)",
            "SE1-LIT(E)-1 LITERATURE(E)",
        ]
        self.assertEqual(
            len(expected_group_names), len(user_data.get("user_groups", []))
        )

        # Check if all the group names match
        return_group_names = [
            group["name"] for group in user_data.get("user_groups", [])
        ]
        self.assertTrue(set(expected_group_names) == set(return_group_names))

    def test_login_sls_teacher(self):
        url = "{}/sls/login/".format(url_prefix)
        body = {"user-id": self.sls_teacher_id}
        response = self.client.post(url, body)
        self.assertEqual(response.status_code, 200)
        self.assertTrue("user" in response.json().get("data", {}))
        self.assertTrue("token" in response.json().get("data", {}))

        expected_user_json = {
            "sls_id": "e37a72e6-bfcc-4d7f-9a41-e556ccf67348",
            "realname": "TESTER 118",
            "username": "e37a72e6-bfcc-4d7f-9a41-e556ccf67348",
            "is_superuser": True,
            "email_address": "e37a72e6-bfcc-4d7f-9a41-e556ccf67348",
        }
        user_data = response.json().get("data", {}).get("user", {})
        for key, val in expected_user_json.items():
            self.assertTrue(user_data.get(key, "") == val)
        self.assertEqual(len(User.objects.all()), 4)

        # Check if the groups the user in are created
        expected_group_names = [
            "SE1-MATHS-1 MATHEMATICS",
            "SE1-SCI-1 SCIENCE",
            "SE1-CH(SS,HE)-1 COMBINED HUMANITIES (S,H)",
            "SE1-LIT(E)-1 LITERATURE(E)",
        ]
        self.assertEqual(
            len(expected_group_names), len(user_data.get("user_groups", []))
        )

        # Check if all the group names match
        return_group_names = [
            group["name"] for group in user_data.get("user_groups", [])
        ]
        self.assertTrue(set(expected_group_names) == set(return_group_names))

    def test_login_already_existing_sls_student(self):
        url = "{}/sls/login/".format(url_prefix)
        body = {"user-id": self.sls_user_id}
        response = self.client.post(url, body)
        self.assertEqual(response.status_code, 200)
        self.assertTrue("user" in response.json().get("data", {}))
        self.assertTrue("token" in response.json().get("data", {}))

        # Try logging a second time
        response = self.client.post(url, body)
        self.assertEqual(response.status_code, 200)
        self.assertTrue("user" in response.json().get("data", {}))
        self.assertTrue("token" in response.json().get("data", {}))
        self.assertEqual(len(User.objects.all()), 4)

    def test_login_already_existing_sls_teacher(self):
        url = "{}/sls/login/".format(url_prefix)
        body = {"user-id": self.sls_teacher_id}
        response = self.client.post(url, body)
        self.assertEqual(response.status_code, 200)
        self.assertTrue("user" in response.json().get("data", {}))
        self.assertTrue("token" in response.json().get("data", {}))

        # Try logging a second time
        response = self.client.post(url, body)
        self.assertEqual(response.status_code, 200)
        self.assertTrue("user" in response.json().get("data", {}))
        self.assertTrue("token" in response.json().get("data", {}))
        self.assertEqual(len(User.objects.all()), 4)
