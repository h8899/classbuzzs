from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
import os.path
from pprint import pprint

from kidsbook.models import Game, GameScene, GameAnswer, Group
from kidsbook.user.views import generate_token
from kidsbook.serializers import GameSceneSerializer, GameSuperuserSerializer, GameAnswerSerializer


User = get_user_model()
url_prefix = '/api/v1'

class TestGame(APITestCase):
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

        # Url
        self.url = "{}/game/".format(url_prefix)

        # Create a game
        csv_file = "Game_Module_Template.csv"
        with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), csv_file), 'rb') as upload_file:
            response = self.client.post(
                "{}/game/".format(url_prefix), {"group_id": str(self.group.id), "file": upload_file},
                HTTP_AUTHORIZATION=self.superuser_token
            )
            self.game = response.data['data']
        self.assertEqual(202, response.status_code)

    def get_token(self, user):
        token = generate_token(user)
        return 'Bearer {0}'.format(token.decode('utf-8'))

    def matching_two_answers(self, answer1, answer2):
        if len(answer1) != len(answer2):
            return False

        temp = answer2.copy()
        for ans1 in iter(answer1):
            for index, ans2 in iter(enumerate(temp)):
                if ans1 == ans2:
                    break
            else:
                return False
            temp.pop(index)

        return True

    def populate_game_scenes(self, game):
        game_scenes = GameSceneSerializer(GameScene.objects.filter(game_id=game['id']), many=True).data
        scenes = {str(scene['id']): scene for scene in iter(game_scenes)}
        return scenes

    def traverse_to_check_stats(self, answers, game, expected_stats):
        game = GameSuperuserSerializer(Game.objects.get(id=game['id'])).data
        game_stats = game['stats']
        scenes = self.populate_game_scenes(game)
        cur_scene = scenes[game['first_scene']]

        for ans in iter(answers):
            if cur_scene['is_end']:
                break

            if not expected_stats:
                return False

            if game_stats['answers'][str(cur_scene['id'])] != expected_stats.pop(0):
                return False

            next_scene_id = cur_scene['choices'][int(ans)]['pathway']
            cur_scene = scenes[next_scene_id]
        return True

    def changes_have_been_applied(self, expected, current):
        for key, val in iter(expected.items()):
            if key not in current:
                return False

            if current[key] != val:
                return False

        return True

    def populate_game_scenes_2(self, game_id):
        game_scenes = GameSceneSerializer(GameScene.objects.filter(game_id=game_id), many=True).data
        scenes = {str(scene['id']): scene for scene in iter(game_scenes)}
        return scenes

    def populate_dict_from_list(self, scenes):
        return {str(scene['id']): scene for scene in iter(scenes)}

    def traverse_to_get_scenes_in_path(self, answer_data):
        game = GameSuperuserSerializer(Game.objects.get(id=answer_data['game'])).data
        scenes = self.populate_game_scenes_2(answer_data['game'])
        cur_scene = scenes[game['first_scene']]
        answer_scenes = {}

        for ans in iter(answer_data['answers']):
            if cur_scene['is_end'] or not 0 <= int(ans) < len(cur_scene['choices']):
                break

            answer_scenes[cur_scene['id']] = cur_scene
            next_scene_id = cur_scene['choices'][int(ans)]['pathway']
            cur_scene = scenes[next_scene_id]
        return answer_scenes

    def test_get_game_with_id(self):
        url = "{}{}/".format(self.url, self.game['id'])
        response = self.client.get(url, HTTP_AUTHORIZATION=self.user_token)
        self.assertEqual(200, response.status_code)

        returned_game = response.data['data']
        for key, value in iter(self.game.items()):
            self.assertEqual(str(value), str(returned_game[key]))

        # Compare the scenes and answers
        all_scenes = GameScene.objects.filter(game_id=self.game['id'])
        all_answers = GameAnswer.objects.filter(game_id=self.game['id'])
        all_scenes = GameSceneSerializer(all_scenes, many=True).data
        all_answers = GameAnswerSerializer(all_answers, many=True).data

        self.assertEqual(self.populate_dict_from_list(all_scenes), returned_game['scenes'])
        self.assertEqual(self.populate_dict_from_list(all_answers), returned_game['answers'])

    def test_update_game(self):
        url = "{}{}/".format(self.url, self.game['id'])
        new_details = {
            'title': 'du hast mich',
            'preface': 'postface mkll',
            'first_scene': 'lastqwe'
        }
        response = self.client.post(url, new_details, HTTP_AUTHORIZATION=self.superuser_token)
        self.assertEqual(202, response.status_code)
        self.assertTrue(self.changes_have_been_applied(new_details, response.data['data']))

    def test_update_game_by_non_superuser(self):
        url = "{}{}/".format(self.url, self.game['id'])
        new_details = {
            'title': 'du hast mich',
            'preface': 'postface mkll',
            'first_scene': 'lastqwe'
        }
        response = self.client.post(url, new_details, HTTP_AUTHORIZATION=self.user_token)
        self.assertEqual(403, response.status_code)

    def test_delete_a_game(self):
        url = "{}{}/".format(self.url, self.game['id'])
        response = self.client.delete(url, HTTP_AUTHORIZATION=self.superuser_token)
        self.assertEqual(202, response.status_code)

        all_games = GameSuperuserSerializer(Game.objects.all(), many=True).data
        self.assertEqual(0, len(all_games))
        al_scenes = GameSceneSerializer(GameScene.objects.all(), many=True).data
        self.assertEqual(0, len(al_scenes))

    def test_delete_a_game_by_non_superuser(self):
        url = "{}{}/".format(self.url, self.game['id'])
        response = self.client.delete(url, HTTP_AUTHORIZATION=self.user_token)
        self.assertEqual(403, response.status_code)

    def test_delete_a_game_by_a_different_superuser(self):
        username = "zxcasd"
        email = "zxcxcml@snow.com"
        password = "123"
        superuser = User.objects.create_superuser(username=username, email_address=email, password=password)
        superuser_token = self.get_token(superuser)

        url = "{}{}/".format(self.url, self.game['id'])
        response = self.client.delete(url, HTTP_AUTHORIZATION=self.user_token)
        self.assertEqual(403, response.status_code)

    def test_create_an_answer(self):
        url = "{}{}/user/{}/".format(self.url, self.game['id'], self.user.id)
        answers = [2, 1, 1]
        response = self.client.post(url, {'answers': answers}, HTTP_AUTHORIZATION=self.user_token)
        self.assertEqual(202, response.status_code)
        game_answer = response.data['data']
        self.assertEqual('Bullying', game_answer['ending'])

        stats = GameSuperuserSerializer(
            Game.objects.get(id=self.game['id'])
        ).data['stats']
        self.assertEqual(stats['num_of_responses'], 1)
        expected_stats = [[0,0,1], [0,1,0], [0,1,0]]
        self.assertTrue(self.traverse_to_check_stats(answers, self.game, expected_stats))
        expected_end_stats = {
            '<equal>': 0,
            'Bullying': 1,
            'Ignoring': 0,
            'Upstanding': 0
        }
        self.assertEqual(expected_end_stats, stats['answers'][self.game['last_scene']])

    def test_create_an_answer_with_too_many_choices(self):
        url = "{}{}/user/{}/".format(self.url, self.game['id'], self.user.id)
        answers = [0, 0, 0, 1, 2, 1]
        response = self.client.post(url, {'answers': answers}, HTTP_AUTHORIZATION=self.user_token)
        self.assertEqual(202, response.status_code)
        stats = GameSuperuserSerializer(
            Game.objects.get(id=self.game['id'])
        ).data['stats']

        self.assertEqual(stats['num_of_responses'], 1)
        count = 0
        for ans in iter(stats['answers'].values()):
            if ans == [1, 0, 0]:
                count += 1
        self.assertEqual(count, 3)

        expected_stats = [[1,0,0], [1,0,0], [1,0,0]]
        self.assertTrue(self.traverse_to_check_stats(answers, self.game, expected_stats))
        expected_end_stats = {
            '<equal>': 1,
            'Bullying': 0,
            'Ignoring': 0,
            'Upstanding': 0
        }
        self.assertEqual(expected_end_stats, stats['answers'][self.game['last_scene']])

    def test_create_a_unfinished_answer(self):
        url = "{}{}/user/{}/".format(self.url, self.game['id'], self.user.id)
        answers = [2, 1]
        response = self.client.post(url, {'answers': answers}, HTTP_AUTHORIZATION=self.user_token)
        self.assertEqual(202, response.status_code)
        stats = GameSuperuserSerializer(
            Game.objects.get(id=self.game['id'])
        ).data['stats']

        self.assertEqual(stats['num_of_responses'], 1)
        expected_stats = [[0,0,1], [0,1,0]]
        self.assertTrue(self.traverse_to_check_stats(answers, self.game, expected_stats))
        self.assertTrue(all(ending == 0 for ending in stats['answers'][self.game['last_scene']].values()))

    def test_create_answer_with_an_out_of_range_choice(self):
        url = "{}{}/user/{}/".format(self.url, self.game['id'], self.user.id)
        answers = [3, 1]
        response = self.client.post(url, {'answers': answers}, HTTP_AUTHORIZATION=self.user_token)
        self.assertEqual(400, response.status_code)

    def test_get_game_stats_after_creating_2_answers(self):
        # Create 2 answers
        url = "{}{}/user/{}/".format(self.url, self.game['id'], self.user.id)
        answers1 = [0, 2, 2]
        response1 = self.client.post(url, {'answers': answers1}, HTTP_AUTHORIZATION=self.user_token)
        self.assertEqual(202, response1.status_code)
        url = "{}{}/user/{}/".format(self.url, self.game['id'], self.another_user.id)
        answers2 = [0, 1, 0]
        response2 = self.client.post(url, {'answers': answers2}, HTTP_AUTHORIZATION=self.another_token)
        self.assertEqual(202, response2.status_code)

        game_answer1 = response1.data['data']
        self.assertEqual('Upstanding', game_answer1['ending'])
        game_answer2 = response2.data['data']
        self.assertEqual('<equal>', game_answer2['ending'])

        stats = GameSuperuserSerializer(
            Game.objects.get(id=self.game['id'])
        ).data['stats']
        self.assertEqual(stats['num_of_responses'], 2)

        expected_stats = [[2,0,0], [0,1,1], [0,0, 1]]
        self.assertTrue(self.traverse_to_check_stats(answers1, self.game, expected_stats))
        expected_stats = [[2,0,0], [0,1,1], [1,0,0]]
        self.assertTrue(self.traverse_to_check_stats(answers2, self.game, expected_stats))
        expected_end_stats = {
            '<equal>': 1,
            'Bullying': 0,
            'Ignoring': 0,
            'Upstanding': 1
        }
        self.assertEqual(expected_end_stats, stats['answers'][self.game['last_scene']])

    def test_get_game_stats_after_creating_2_answers_for_game_with_different_threshold(self):
        # Create a game with threshold
        csv_file = "Game_Module_Template_2.csv"
        params = {
            "group_id": str(self.group.id),
            'title': 'mklsad',
            'threshold': 3
        }
        with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), csv_file), 'rb') as upload_file:
            params["file"] = upload_file
            response = self.client.post(
                "{}/game/".format(url_prefix), params,
                HTTP_AUTHORIZATION=self.superuser_token
            )
            self.assertEqual(202, response.status_code)
            game = response.data['data']

        # Create 2 answers
        url = "{}{}/user/{}/".format(self.url, game['id'], self.user.id)
        answers1 = [0, 2, 2, 1]
        response1 = self.client.post(url, {'answers': answers1}, HTTP_AUTHORIZATION=self.user_token)
        self.assertEqual(202, response1.status_code)
        url = "{}{}/user/{}/".format(self.url, game['id'], self.another_user.id)
        answers2 = [0, 1, 0, 1]
        response2 = self.client.post(url, {'answers': answers2}, HTTP_AUTHORIZATION=self.another_token)
        self.assertEqual(202, response2.status_code)

        game_answer1 = response1.data['data']
        self.assertEqual('Upstanding', game_answer1['ending'])
        game_answer2 = response2.data['data']
        self.assertEqual('<equal>', game_answer2['ending'])

        stats = GameSuperuserSerializer(
            Game.objects.get(id=game['id'])
        ).data['stats']
        self.assertEqual(stats['num_of_responses'], 2)

        expected_stats = [[2,0,0], [0,1,1], [0,0, 1], [0, 1, 0]]
        self.assertTrue(self.traverse_to_check_stats(answers1, game, expected_stats))
        expected_stats = [[2,0,0], [0,1,1], [1,0,0], [0, 1, 0]]
        self.assertTrue(self.traverse_to_check_stats(answers2, game, expected_stats))
        expected_end_stats = {
            '<equal>': 1,
            'Hurtful Comment': 0,
            'Ignoring': 0,
            'Upstanding': 1
        }
        self.assertEqual(expected_end_stats, stats['answers'][game['last_scene']])

    def test_get_answer(self):
        url = "{}{}/user/{}/".format(self.url, self.game['id'], self.user.id)
        answers = [1, 1, 1, 1]
        self.client.post(url, {'answers': answers}, HTTP_AUTHORIZATION=self.user_token)

        # Get the answer
        response = self.client.get(url, HTTP_AUTHORIZATION=self.user_token)
        self.assertEqual(200, response.status_code)
        self.assertEqual(answers, response.data['data']['answer']['answers'])

        # Compare the scenes received with scenes in path
        scenes_in_answers = self.traverse_to_get_scenes_in_path(response.data['data']['answer'])
        self.assertEqual(scenes_in_answers, response.data['data']['scenes'])

    def test_get_answer_by_superuser(self):
        url = "{}{}/user/{}/".format(self.url, self.game['id'], self.user.id)
        answers = [1, 1, 1, 1]
        self.client.post(url, {'answers': answers}, HTTP_AUTHORIZATION=self.user_token)

        # Get the answer
        response = self.client.get(url, HTTP_AUTHORIZATION=self.superuser_token)
        self.assertEqual(200, response.status_code)
        self.assertEqual(answers, response.data['data']['answer']['answers'])

    def test_get_answer_by_another_user(self):
        url = "{}{}/user/{}/".format(self.url, self.game['id'], self.user.id)
        answers = [1, 1, 1, 1]
        self.client.post(url, {'answers': answers}, HTTP_AUTHORIZATION=self.superuser_token)

        # Get the answer
        response = self.client.get(url, HTTP_AUTHORIZATION=self.another_token)
        self.assertEqual(405, response.status_code)

    def test_update_an_answer(self):
        url = "{}{}/user/{}/".format(self.url, self.game['id'], self.user.id)
        answers = [1, 1, 1, 1]
        self.client.post(url, {'answers': answers}, HTTP_AUTHORIZATION=self.user_token)

        # Update the prev answer
        new_answers = [1, 0, 1, 2]
        response = self.client.post(url, {'answers': new_answers}, HTTP_AUTHORIZATION=self.user_token)
        self.assertEqual(202, response.status_code)
        stats = GameSuperuserSerializer(
            Game.objects.get(id=self.game['id'])
        ).data['stats']

        self.assertEqual(stats['num_of_responses'], 1)
        expected_stats = [[0,1,0], [1,0,0], [0,1,0], [0, 0, 1, 0]]
        self.assertTrue(self.traverse_to_check_stats(new_answers, self.game, expected_stats))

    def test_update_an_unfinished_answer_to_finished(self):
        url = "{}{}/user/{}/".format(self.url, self.game['id'], self.user.id)
        answers = [1, 1]
        self.client.post(url, {'answers': answers}, HTTP_AUTHORIZATION=self.user_token)

        # Update the prev answer
        new_answers = [1, 0, 1, 2]
        response = self.client.post(url, {'answers': new_answers}, HTTP_AUTHORIZATION=self.user_token)
        self.assertEqual(202, response.status_code)
        stats = GameSuperuserSerializer(
            Game.objects.get(id=self.game['id'])
        ).data['stats']

        self.assertEqual(stats['num_of_responses'], 1)
        expected_stats = [[0,1,0], [1,0,0], [0,1,0], [0, 0, 1, 0]]
        self.assertTrue(self.traverse_to_check_stats(new_answers, self.game, expected_stats))

    def test_update_a_finished_answer_to_unfinished(self):
        url = "{}{}/user/{}/".format(self.url, self.game['id'], self.user.id)
        answers = [1, 1, 1, 1]
        self.client.post(url, {'answers': answers}, HTTP_AUTHORIZATION=self.user_token)

        # Update the prev answer
        new_answers = [1, 0]
        response = self.client.post(url, {'answers': new_answers}, HTTP_AUTHORIZATION=self.user_token)
        self.assertEqual(202, response.status_code)
        stats = GameSuperuserSerializer(
            Game.objects.get(id=self.game['id'])
        ).data['stats']

        self.assertEqual(stats['num_of_responses'], 1)
        expected_stats = [[0,1,0], [1,0,0]]
        self.assertTrue(self.traverse_to_check_stats(new_answers, self.game, expected_stats))

        # Ensure that all other answers are empty in stats
        count = 0
        for val in iter(stats['answers'].values()):
            if all(element==0 for element in val):
                count += 1
        self.assertEqual(3, count)

    def test_update_answer_by_another_user(self):
        url = "{}{}/user/{}/".format(self.url, self.game['id'], self.user.id)
        answers = [1, 1, 1, 1]
        self.client.post(url, {'answers': answers}, HTTP_AUTHORIZATION=self.user_token)

        # Update the prev answer
        new_answers = [1, 0]
        response = self.client.post(url, {'answers': new_answers}, HTTP_AUTHORIZATION=self.another_token)
        self.assertEqual(405, response.status_code)

    def test_delete_an_answer(self):
        url = "{}{}/user/{}/".format(self.url, self.game['id'], self.user.id)
        answers = [1, 1, 1, 1]
        self.client.post(url, {'answers': answers}, HTTP_AUTHORIZATION=self.user_token)
        response = self.client.delete(url, HTTP_AUTHORIZATION=self.user_token)
        self.assertEqual(202, response.status_code)

        stats = GameSuperuserSerializer(
            Game.objects.get(id=self.game['id'])
        ).data['stats']

        self.assertEqual(stats['num_of_responses'], 0)

        # Ensure that all other answers are empty in stats
        count = 0
        for val in iter(stats['answers'].values()):
            if all(element==0 for element in val):
                count += 1
        self.assertEqual(len(stats['answers'].keys())-1, count)

    def test_get_all_answers(self):
        # Create 3 answers for 3 users
        url = "{}{}/user/{}/".format(self.url, self.game['id'], self.user.id)
        answer1 = [1, 1, 2, 0]
        self.client.post(url, {'answers': answer1}, HTTP_AUTHORIZATION=self.user_token)
        url = "{}{}/user/{}/".format(self.url, self.game['id'], self.superuser.id)
        answer2 = [0, 1, 0, 1]
        self.client.post(url, {'answers': answer2}, HTTP_AUTHORIZATION=self.superuser_token)
        url = "{}{}/user/{}/".format(self.url, self.game['id'], self.another_user.id)
        answer3 = [2, 1, 1, 1]
        self.client.post(url, {'answers': answer3}, HTTP_AUTHORIZATION=self.another_token)

        # Get all 3 answers
        url = "{}{}/answers/".format(self.url, self.game['id'])
        response = self.client.get(url, HTTP_AUTHORIZATION=self.superuser_token)
        self.assertEqual(200, response.status_code)
        self.assertEqual(3, len(response.data['data']))

        expected_response = [answer1, answer2, answer3]
        answers_from_response = [answer['answers'] for answer in iter(response.data['data'])]
        self.assertTrue(self.matching_two_answers(expected_response, answers_from_response))

    def test_get_all_answers_by_non_superuser(self):
        # Create 3 answers for 3 users
        url = "{}{}/user/{}/".format(self.url, self.game['id'], self.user.id)
        answer1 = [1, 1, 2, 0]
        self.client.post(url, {'answers': answer1}, HTTP_AUTHORIZATION=self.user_token)
        url = "{}{}/user/{}/".format(self.url, self.game['id'], self.superuser.id)
        answer2 = [0, 1, 0, 1]
        self.client.post(url, {'answers': answer2}, HTTP_AUTHORIZATION=self.superuser_token)
        url = "{}{}/user/{}/".format(self.url, self.game['id'], self.another_user.id)
        answer3 = [2, 1, 1, 1]
        self.client.post(url, {'answers': answer3}, HTTP_AUTHORIZATION=self.another_token)

        # Get all 3 answers
        url = "{}{}/answers/".format(self.url, self.game['id'])
        response = self.client.get(url, HTTP_AUTHORIZATION=self.user_token)
        self.assertEqual(403, response.status_code)
