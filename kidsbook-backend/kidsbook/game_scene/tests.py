from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
import os.path
from pprint import pprint

from kidsbook.models import Game, GameScene, GameAnswer, Group
from kidsbook.user.views import generate_token
from kidsbook.serializers import GameSceneSerializer, GameSuperuserSerializer, GameAnswerSerializer


User = get_user_model()
url_prefix = '/api/v1'

class TestGameScene(APITestCase):
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
        self.group.add_member(self.another_user)

        csv_file = "../game/Game_Module_Template.csv"
        with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), csv_file), 'rb') as upload_file:
            response = self.client.post(
                "{}/game/".format(url_prefix), {"group_id": str(self.group.id), "file": upload_file},
                HTTP_AUTHORIZATION=self.superuser_token
            )
            self.game = response.data['data']
        self.assertEqual(202, response.status_code)

        # Url
        self.url = "{}/scene/".format(url_prefix)

    def get_token(self, user):
        token = generate_token(user)
        return 'Bearer {0}'.format(token.decode('utf-8'))

    def populate_game_scenes(self, game):
        game_scenes = GameSceneSerializer(GameScene.objects.filter(game_id=game['id']), many=True).data
        scenes = {str(scene['id']): scene for scene in iter(game_scenes)}
        return scenes

    def traverse_to_get_scene(self, answers, game):
        game = GameSuperuserSerializer(Game.objects.get(id=game['id'])).data
        scenes = self.populate_game_scenes(game)
        cur_scene = scenes[game['first_scene']]

        for ans in iter(answers):
            if cur_scene['is_end']:
                break

            next_scene_id = cur_scene['choices'][int(ans)]['pathway']
            cur_scene = scenes[next_scene_id]
        return cur_scene

    def test_get_scene(self):
        all_scenes = GameScene.objects.all()
        for scene in iter(all_scenes):
            url = "{}{}/".format(self.url, scene.id)
            response = self.client.get(url, HTTP_AUTHORIZATION=self.user_token)
            self.assertEqual(200, response.status_code)

            if response.data['data']['scene']['is_end']:
                self.assertEqual('', response.data['data']['ending'])

    def test_get_scene_with_ending(self):
        # Create an unfinished answer
        url = "{}/game/{}/user/{}/".format(url_prefix, self.game['id'], self.user.id)
        answers = [2, 1, 1, 0]
        self.client.post(url, {'answers': answers}, HTTP_AUTHORIZATION=self.user_token)

        last_scene_id = self.game['last_scene']
        url = "{}{}/".format(self.url, last_scene_id)
        response = self.client.get(url, HTTP_AUTHORIZATION=self.user_token)
        self.assertEqual(200, response.status_code)
        self.assertEqual('Bullying', response.data['data']['ending'])

    def test_get_the_next_unanswered_scene(self):
        # Create an unfinished answer
        url = "{}/game/{}/user/{}/".format(url_prefix, self.game['id'], self.user.id)
        answers = [2, 1]
        self.client.post(url, {'answers': answers}, HTTP_AUTHORIZATION=self.user_token)

        # Get the next scene
        url = "{}?game_id={}".format(self.url, self.game['id'])
        response = self.client.get(url, HTTP_AUTHORIZATION=self.user_token)
        self.assertEqual(200, response.status_code)

        # Traverse to see if it is the correct scene
        expected_scene = self.traverse_to_get_scene(answers, self.game)
        self.assertEqual(str(response.data['data']['scene']['id']), expected_scene['id'])

    def test_get_next_unanswered_scene_with_no_answers(self):
        # Get the next scene
        url = "{}?game_id={}".format(self.url, self.game['id'])
        response = self.client.get(url, HTTP_AUTHORIZATION=self.user_token)
        self.assertEqual(200, response.status_code)

        # Traverse to see if it is the correct scene
        self.assertEqual(str(response.data['data']['scene']['id']), self.game['first_scene'])
        self.assertEqual(response.data['data']['answers'], [])

    def test_get_the_next_scene_end(self):
        # Create an unfinished answer
        url = "{}/game/{}/user/{}/".format(url_prefix, self.game['id'], self.user.id)
        answers = [2, 1, 1, 0]
        self.client.post(url, {'answers': answers}, HTTP_AUTHORIZATION=self.user_token)

        # Get the next scene
        url = "{}?game_id={}".format(self.url, self.game['id'])
        response = self.client.get(url, HTTP_AUTHORIZATION=self.user_token)
        self.assertEqual(200, response.status_code)

        # Traverse to see if it is the correct scene
        expected_scene = self.traverse_to_get_scene(answers, self.game)
        self.assertEqual(str(response.data['data']['scene']['id']), expected_scene['id'])
        self.assertTrue(expected_scene['is_end'])

    def test_get_the_next_scene_end_with_too_many_answers(self):
        # Create an unfinished answer
        url = "{}/game/{}/user/{}/".format(url_prefix, self.game['id'], self.user.id)
        answers = [2, 1, 1, 0, 1, 2]
        self.client.post(url, {'answers': answers}, HTTP_AUTHORIZATION=self.user_token)

        # Get the next scene
        url = "{}?game_id={}".format(self.url, self.game['id'])
        response = self.client.get(url, HTTP_AUTHORIZATION=self.user_token)
        self.assertEqual(200, response.status_code)

        # Traverse to see if it is the correct scene
        expected_scene = self.traverse_to_get_scene(answers, self.game)
        self.assertEqual(str(response.data['data']['scene']['id']), expected_scene['id'])
        self.assertTrue(expected_scene['is_end'])
