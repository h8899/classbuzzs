from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
import os.path
from uuid import UUID
from pprint import pprint

from kidsbook.models import Game, GameScene, GameAnswer, Group
from kidsbook.user.views import generate_token
from kidsbook.serializers import GameSceneSerializer,GameSuperuserSerializer


User = get_user_model()
url_prefix = '/api/v1'

class TestGameParser(APITestCase):
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
        self.url = "{}/game/".format(url_prefix)

    def get_token(self, user):
        token = generate_token(user)
        return 'Bearer {0}'.format(token.decode('utf-8'))

    def changes_no_difference_in_response(self, request_changes, current_state):
        for key, val in iter(request_changes.items()):
            if key not in current_state:
                return False
            if val != current_state[key]:
                return False
        return True

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

    def build_scenes_as_a_tree_from_game(self, game_id):
        tree = {}
        mapping = {}
        index = 1

        def rename_dict(d):
            new = {}
            for k, v in d.items():
                if isinstance(v, dict):
                    v = rename_dict(v)
                new[mapping[k]] = v
            return new

        def dfs_to_build_scenes(cur_scene_id, stack):
            nonlocal index
            scene = GameScene.objects.get(id=cur_scene_id)
            if str(scene.id) not in mapping:
                mapping[str(scene.id)] = index
                index += 1

            if scene.is_end:
                return
            pathways = [choice['pathway'] for choice in iter(scene.choices)]
            if not stack:
                tree[cur_scene_id] = {}
                stack.append(cur_scene_id)

            for pathway in iter(pathways):
                # Treverse to current node
                temp = tree
                for id in stack:
                    temp = temp[id]
                temp[pathway] = {}
                stack.append(pathway)
                if str(pathway) not in mapping:
                    mapping[str(pathway)] = index
                    index += 1

                dfs_to_build_scenes(pathway, stack)
                stack.pop()

        game = Game.objects.get(id=game_id)
        dfs_to_build_scenes(game.first_scene, [])
        return rename_dict(tree)

    def test_create_a_game(self):
        csv_file = "Game_Module_Template.csv"
        with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), csv_file), 'rb') as upload_file:
            response = self.client.post(
                self.url, {"group_id": str(self.group.id), "file": upload_file},
                HTTP_AUTHORIZATION=self.superuser_token
            )
        self.assertEqual(202, response.status_code)

        # Matching number of game scenes
        created_scenes = GameSceneSerializer(GameScene.objects.all(), many=True).data
        created_scenes = [dict(scene) for scene in created_scenes]
        self.assertEqual(6, len(created_scenes))

        # Generate pathways
        first_scene_id = response.data.get('data', {})['first_scene']
        first_scene = GameScene.objects.get(id=first_scene_id)
        pathways = {
            str(scene['id']): tuple([choice['pathway'] for choice in scene['choices']]) for scene in created_scenes
            if not scene['is_end']
        }

        # Check if 1 starting scene and 1 ending scene
        end_scenes = set()
        self.traverse_to_scene(first_scene_id, pathways, end_scenes)
        self.assertEqual(1, len(end_scenes))

        # Check if the logic tree is correct
        expected_tree = {1: {2: {3: {4: {}}, 5: {4: {}}, 6: {4: {}}}}}
        tree_from_game = self.build_scenes_as_a_tree_from_game(response.data['data']['id'])
        self.assertEqual(expected_tree, tree_from_game)

    def test_create_a_game_2(self):
        csv_file = "Game_Module_Template_2.csv"
        with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), csv_file), 'rb') as upload_file:
            response = self.client.post(
                self.url, {"group_id": str(self.group.id), "file": upload_file},
                HTTP_AUTHORIZATION=self.superuser_token
            )
        self.assertEqual(202, response.status_code)

        # Matching number of game scenes
        created_scenes = GameSceneSerializer(GameScene.objects.all(), many=True).data
        created_scenes = [dict(scene) for scene in created_scenes]
        self.assertEqual(15, len(created_scenes))

        # Generate pathways
        first_scene_id = response.data.get('data', {})['first_scene']
        first_scene = GameScene.objects.get(id=first_scene_id)
        pathways = {
            str(scene['id']): tuple([choice['pathway'] for choice in scene['choices']]) for scene in created_scenes
            if not scene['is_end']
        }

        # Check if 1 starting scene and 1 ending scene
        end_scenes = set()
        self.traverse_to_scene(first_scene_id, pathways, end_scenes)
        self.assertEqual(1, len(end_scenes))

        # Check if the logic tree is correct
        expected_tree = {1: {2: {3: {4: {5: {}}, 6: {5: {}}, 7: {5: {}}},
         8: {9: {5: {}}, 10: {5: {}}, 11: {5: {}}},
         12: {13: {5: {}}, 14: {5: {}}, 15: {5: {}}}}}}
        tree_from_game = self.build_scenes_as_a_tree_from_game(response.data['data']['id'])
        self.assertEqual(expected_tree, tree_from_game)

    def test_create_many_games(self):
        csv_file = "Game_Module_Template.csv"
        for index in range(7):
            with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), csv_file), 'rb') as upload_file:
                response = self.client.post(
                    self.url, {"group_id": str(self.group.id), "file": upload_file},
                    HTTP_AUTHORIZATION=self.superuser_token
                )
            self.assertEqual(202, response.status_code)

            # Matching number of game scenes
            created_scenes = GameSceneSerializer(GameScene.objects.all(), many=True).data
            created_scenes = [dict(scene) for scene in created_scenes]
            self.assertEqual(6*(index+1), len(created_scenes))

            # Generate pathways
            first_scene_id = response.data.get('data', {})['first_scene']
            first_scene = GameScene.objects.get(id=first_scene_id)
            pathways = {
                str(scene['id']): tuple([choice['pathway'] for choice in scene['choices']]) for scene in created_scenes
                if not scene['is_end']
            }

            # Check if 1 starting scene and 1 ending scene
            end_scenes = set()
            self.traverse_to_scene(first_scene_id, pathways, end_scenes)
            self.assertEqual(1, len(end_scenes))

    def test_create_game_without_group_id(self):
        csv_file = "Game_Module_Template.csv"
        with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), csv_file), 'rb') as upload_file:
            response = self.client.post(
                self.url, {"file": upload_file},
                HTTP_AUTHORIZATION=self.superuser_token
            )
        self.assertEqual(400, response.status_code)

    def test_create_game_without_file(self):
        response = self.client.post(
            self.url, {"group_id": str(self.group.id)},
            HTTP_AUTHORIZATION=self.superuser_token
        )

        self.assertEqual(400, response.status_code)

    def test_create_game_with_other_info(self):
        csv_file = "Game_Module_Template.csv"
        with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), csv_file), 'rb') as upload_file:
            params = {
                "group_id": str(self.group.id),
                "file": upload_file,
                "title": "hello 123",
                "preface": 'mkqwe;l'
            }
            response = self.client.post(
                self.url,
                params,
                HTTP_AUTHORIZATION=self.superuser_token
            )
        self.assertEqual(202, response.status_code)
        expected_response = {
            "group": str(self.group.id),
            "title": "hello 123",
            "preface": 'mkqwe;l'
        }

        self.assertTrue(self.changes_no_difference_in_response(expected_response, response.data.get('data', {})))
