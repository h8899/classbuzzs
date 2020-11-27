from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
import os.path
from uuid import UUID

from kidsbook.models import Game, GameScene, GameAnswer, Group
from kidsbook.user.views import generate_token
from kidsbook.serializers import GameSceneSerializer


User = get_user_model()
url_prefix = '/api/v1'

class TestGameGroup(APITestCase):
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

        # Url
        self.url = "{}/group/{}/games/".format(url_prefix, str(self.group.id))

        # Create many games
        csv_file = "../game/Game_Module_Template.csv"
        url = "{}/game/".format(url_prefix)
        for index in range(7):
            with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), csv_file), 'rb') as upload_file:
                response = self.client.post(
                    url, {"group_id": str(self.group.id), "file": upload_file},
                    HTTP_AUTHORIZATION=self.superuser_token
                )

    def get_token(self, user):
        token = generate_token(user)
        return 'Bearer {0}'.format(token.decode('utf-8'))

    def compare_two_scenes(self, scenes, expected_scenes):
        for scene, expected_scene in iter(zip(scenes, expected_scenes)):
            for key, value in iter(expected_scene.items()):
                if key not in scene or expected_scene[key] != scene[key]:
                    return False

        return True

    def traverse_to_scene(self, scene_id, pathways, end_scenes):
        # DFS
        if scene_id in pathways:
            for next_scene_id in pathways[scene_id]:
                self.traverse_to_scene(next_scene_id, pathways, end_scenes)
        else:
            end_scenes.add(scene_id)

    def test_get_all_games_in_group(self):
        response = self.client.get(self.url, HTTP_AUTHORIZATION=self.user_token)
        self.assertEqual(200, response.status_code)
        self.assertEqual(7, len(response.data['data']))

    def test_get_all_games_in_group_by_superuser(self):
        response = self.client.get(self.url, HTTP_AUTHORIZATION=self.superuser_token)
        self.assertEqual(200, response.status_code)
        self.assertEqual(7, len(response.data['data']))

    def test_get_all_games_in_group_by_user_not_in_group(self):
        response = self.client.get(self.url, HTTP_AUTHORIZATION=self.another_token)
        self.assertEqual(403, response.status_code)
