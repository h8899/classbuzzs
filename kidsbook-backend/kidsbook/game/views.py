from csv import reader
from operator import itemgetter
from django.contrib.auth import get_user_model
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import FileUploadParser
from rest_framework import status
from collections import Counter
from pprint import pprint

from kidsbook.serializers import *
from kidsbook.models import *
from kidsbook.permissions import *
from kidsbook.utils import *


User = get_user_model()

def get_serializer_class(user):
    if user.role.id <= 1:
        return GameSuperuserSerializer
    else:
        return GameSerializer


def convert_file_bytes_into_list_of_lists(file_obj):
    # Decode <bytes> into <str> and remove BOM
    raw_string_from_file = file_obj.read().decode("utf-8-sig")

    # Split the whole string into multiple lines for csv.reader
    data = [row.strip() for row in raw_string_from_file.splitlines()]

    # Parse the list of <str> into a list of lists of <str>
    csv_reader = list(reader(data))

    return csv_reader


def add_next_scenes_to_order(scene_id, cur_scene, scenes_create_order, unmapped_scenes):
    pathways = set([choice['pathway'] for choice in cur_scene.get('choices', [])])
    if pathways:
        for index, path_set in iter(enumerate(scenes_create_order)):
            if scene_id in path_set:
                if index == len(scenes_create_order) - 1:
                    scenes_create_order.append(pathways)
                else:
                    scenes_create_order[index+1] = scenes_create_order[index+1].union(pathways)
                break
        else:   # If no set has the `scene_id`
            unmapped_scenes[scene_id] = pathways

    for key, unmapped_pathways in iter(unmapped_scenes.items()):
        for index, path_set in iter(enumerate(scenes_create_order)):
            if key in path_set:
                if index == len(scenes_create_order) - 1:
                    scenes_create_order.append(unmapped_pathways)
                else:
                    scenes_create_order[index+1].union(unmapped_pathways)
                break

def parse_scenes_details_and_creating_orders(strings_data, scenes, scenes_create_order):
    allowed_keywords = {'Scene', 'character', 'choice', 'END', 'Display text'}
    scene_id = None
    unmapped_scenes = {}
    cur_scene = {}
    """
    cur_scene's format:
    {
        choices: [
            {
                - text(str)
                - tag(str)
                - pathway (str)
            }
        ],
        dialogue: [
            {
            - name (str): The name of the person who speaks this dialogue. Only applicable if field is_end of its scene is False.
            - speech (str): The name's speech in the dialogue.
            - tag (str): To store the user's answers and his pathway. Only applicable if field is_end of its scene is True.
            }
        ]
    }
    """

    for index, row in iter(enumerate(strings_data)):
        # If all texts in row are empty strings
        if all(text.strip() == "" for text in iter(row)):
            continue

        # Ignores the row, if its first character is '#'
        first_str = row[0].strip()
        if first_str != "" and first_str.startswith('#'):
            continue

        # Return error if invalid keyword (first str)
        if first_str not in allowed_keywords:
            raise ValueError("Invalid keyword at line {}. The keyword must be one of {}".format(index, list(allowed_keywords)))

        # Parse the type of values in row
        if first_str == 'Scene' or first_str == 'END':
            # Append the previous scene before processing the next one
            if scene_id is not None:
                if scene_id in scenes:
                    raise ValueError("Duplicated scene ID of {}".format(repr(scene_id)))
                scenes[scene_id] = cur_scene
                add_next_scenes_to_order(scene_id, cur_scene, scenes_create_order, unmapped_scenes)
                cur_scene = {}
            else: # First scene
                scenes_create_order.append(set([row[1].strip()]))

            scene_id = 'END' if first_str == 'END' else row[1].strip()
            if scene_id == '':
                raise ValueError("Scene ID at line {} must not be empty.".format(index))

        elif first_str == 'character':
            cur_scene.setdefault('dialogue', []).append({
                'name': row[1].strip(),
                'speech': row[2].strip(),
                'tag': row[3].strip()
            })

        elif first_str == 'choice':
            cur_scene.setdefault('choices', []).append({
                'text': row[2].strip(),
                'tag': row[3].strip(),
                'pathway': row[4].strip()
            })

        elif first_str == 'Display text':
            cur_scene.setdefault('dialogue', []).append({
                'speech': row[2].strip(),
                'tag': row[3].strip(),
            })

    # Append the last scene
    if cur_scene:
        if scene_id in scenes:
            raise ValueError("Duplicated scene ID of {}".format(repr(scene_id)))
        scenes[scene_id] = cur_scene
        add_next_scenes_to_order(scene_id, cur_scene, scenes_create_order, unmapped_scenes)

    # Raise an error if there are unused scenes
    if unmapped_scenes:
        raise ValueError("Scenes {} are unused.".format(", ".join(unmapped_scenes.keys())))


def update_pathway_to_real_ids(scene_details, created_scenes):
    if 'choices' not in scene_details:
        return

    choices = scene_details['choices']
    for index, choice in iter(enumerate(choices)):
        pathway_scene_id = choice.get('pathway', '')
        if pathway_scene_id not in created_scenes:
            raise RuntimeError("The referenced pathways of scene {} must be created before the scene".format(pathway_scene_id))

        choice['pathway'] = created_scenes[pathway_scene_id]
        choices[index] = choice


def create_scenes(created_game_id, scenes, scenes_create_order):
    created_scenes = {}
    end_scene = ''

    for scenes_set in iter(reversed(scenes_create_order)):
        for scene_id in iter(scenes_set):
            if scene_id in created_scenes:
                continue

            # Generate scene's details
            scene_details = scenes[scene_id]
            scene_details['game_id'] = created_game_id
            update_pathway_to_real_ids(scene_details, created_scenes)
            if scene_id == 'END':
                scene_details['is_end'] = True

            # Create the scene
            created_scene = GameScene.objects.create(**scene_details)
            created_scenes[scene_id] = str(created_scene.id)
            if scene_id == 'END':
                end_scene = str(created_scene.id)

    return created_scenes, str(created_scene.id), end_scene

def create_default_stats(created_game, scenes, scene_names_mapping):
    stats_answers = {}
    end_idx = -1

    # Create the default stats for scenes other than 'END'
    for scene_id, scene_details in iter(scenes.items()):
        if str(scene_id) != 'END':
            stats_answers[scene_names_mapping[str(scene_id)]] = [0 for _ in scene_details.get('choices', [])]

    # Assign the default stats on endings
    stats_answers[scene_names_mapping['END']] = {scene['tag']: 0 for scene in scenes['END']['dialogue']}

    # Create a default stats
    created_game.stats = {
        'num_of_responses': 0,
        'answers': stats_answers
    }
    """
    Stats' Format:
        num_of_responses: Int (default: 0),
        answers: {
            '0': [Int, Int, ...],    # Question 1
            '1': [Int, Int, ...],    # Question 2
            ...
        }
    """
    created_game.save()

def create_the_game(request):
    if 'group_id' not in request.data:
        raise ValueError("Field 'group_id' is required to create a game.")

    # Make a copy of data, as it is immutable
    game_params = request.data.dict().copy()
    del game_params['file']
    game_params['creator'] = request.user
    if 'threshold' in game_params:
        game_params['threshold'] = int(game_params['threshold'])
    return str(Game.objects.create(**game_params).id)


def parse_game_file_to_create(request, strings_data):
    scenes = {}
    scenes_create_order = []
    parse_scenes_details_and_creating_orders(strings_data, scenes, scenes_create_order)

    # Create the game and scenes after successfully parsing the file
    created_game_id = create_the_game(request)
    scene_names_mapping, first_scene_id, last_scene_id = create_scenes(created_game_id, scenes, scenes_create_order)
    # Link the first scene with game
    created_game = Game.objects.get(id=created_game_id)
    created_game.first_scene = first_scene_id
    created_game.last_scene = last_scene_id
    create_default_stats(created_game, scenes, scene_names_mapping)
    created_game.save()

    return created_game_id

def parse_game_file_to_update(created_game_id, strings_data):
    scenes = {}
    scenes_create_order = []
    parse_scenes_details_and_creating_orders(strings_data, scenes, scenes_create_order)

    # Get the old scenes, to prepare deletion
    old_scenes = GameScene.objects.filter(game__id=game.id)

    # Create the game and scenes after successfully parsing the file
    _, first_scene_id, last_scene_id = create_scenes(created_game_id, scenes, scenes_create_order)

    # Link the first scene with game
    created_game = Game.objects.get(id=created_game_id)
    created_game.first_scene = first_scene_id
    created_game.last_scene = last_scene_id
    created_game.save()

    # Only delete old scenes if new ones are successfully created
    old_scenes.delete()


## GAME ##

def get_games_created(request):
    try:
        games = Game.objects.filter(creator_id=request.user.id)
        serializer = GameSuperuserSerializer(games, many=True)
        return Response({'data': serializer.data})
    except Exception as exc:
        return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

def create_game_request(request):
    if 'file' not in request.FILES:
        return Response({'error': "Missing the 'file' attribute."}, status=status.HTTP_400_BAD_REQUEST)

    file_obj = request.FILES['file']
    strings_data = convert_file_bytes_into_list_of_lists(file_obj)
    created_game_id = parse_game_file_to_create(request, strings_data)
    created_game = Game.objects.get(id=created_game_id)

    game_fields = set(Game.__dict__.keys())
    for attr, value in iter(request.data.dict().items()):
        if attr in game_fields and attr not in ('file', 'stats', 'first_scene', 'group'):
            setattr(created_game, attr, value)

    created_game.save()
    serializer = GameSerializer(created_game)
    return Response({'data': serializer.data},status=status.HTTP_202_ACCEPTED)

@api_view(['GET', 'POST'])
@permission_classes((IsAuthenticated, IsTokenValid, IsSuperUser))
def game_main(request):
    function_mappings = {
        'GET': get_games_created,
        'POST': create_game_request
    }

    try:
        if request.method in function_mappings:
            return function_mappings[request.method](request)
    except Exception as exc:
        return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    return Response({'error': 'Bad request.'}, status=status.HTTP_400_BAD_REQUEST)


## game's answer ##
def populate_game_scenes(game_id):
    game_scenes = GameSceneSerializer(GameScene.objects.filter(game_id=game_id), many=True).data
    scenes = {str(scene['id']): scene for scene in iter(game_scenes)}
    return scenes

def populate_dict_from_list(scenes):
    return {str(scene['id']): scene for scene in iter(scenes)}

def traverse_to_get_scenes_in_path(answer_data):
    game = GameSuperuserSerializer(Game.objects.get(id=answer_data['game'])).data
    scenes = populate_game_scenes(answer_data['game'])
    cur_scene = scenes[game['first_scene']]
    answer_scenes = {}

    for ans in iter(answer_data['answers']):
        if cur_scene['is_end'] or not 0 <= int(ans) < len(cur_scene['choices']):
            break

        answer_scenes[cur_scene['id']] = cur_scene
        next_scene_id = cur_scene['choices'][int(ans)]['pathway']
        cur_scene = scenes[next_scene_id]
    return answer_scenes

def get_game_answer(request, kargs):
    try:
        game_answer = GameAnswer.objects.get(
            user_id=kargs.get('user_id', ''),
            game=kargs.get('game_id', '')
        )
    except GameAnswer.DoesNotExist:
        return Response({'error': "There are no game' responses from this user."}, status=status.HTTP_400_BAD_REQUEST)

    answer_data = GameAnswerSerializer(game_answer).data

    # Not just return the GameAnswer, but the scenes in the path of the answers
    answer_scenes = traverse_to_get_scenes_in_path(answer_data)

    return Response({'data': {'answer': answer_data, 'scenes': answer_scenes}})

def update_game_stats(answers, game, scenes, value=1):
    game_stats = game.stats
    cur_scene = scenes[game.first_scene]
    answer_stats = {}
    cur_tag = ''

    # Update game's stats
    for ans in iter(answers):
        if cur_scene['is_end']:
            break

        try:
            cur_tag = cur_scene['choices'][int(ans)]['tag']
            if cur_tag not in answer_stats:
                answer_stats[cur_tag] = 1
            else:
                answer_stats[cur_tag] += 1
            game_stats['answers'][str(cur_scene['id'])][int(ans)] += value
            cur_scene = scenes[cur_scene['choices'][int(ans)]['pathway']]
            continue
        except Exception:
            raise ValueError('Invalid answer of {} for scene {}'.format(repr(ans), cur_scene['id']))

        raise ValueError('The answer must be an integer, but got {}'.format(repr(ans)))

    if cur_scene['is_end']:
        # Create / Update an answer
        if value > 0:
            sorted_answer_stats = sorted(answer_stats.items(), key=itemgetter(1), reverse=True)
            if len(sorted_answer_stats) > 1 and sorted_answer_stats[0][1] == sorted_answer_stats[1][1]:
                return '<equal>'
            if sorted_answer_stats[0][1] >= game.threshold:
                return sorted_answer_stats[0][0]
            return '<equal>'
    """
    Stats' Format:
        num_of_responses: Int (default: 0),
        answers: {
            '0': [Int, Int, ...],    # Question 1
            '1': [Int, Int, ...],    # Question 2
            ...
        }
    """
    # If no `ending`
    return None

def update_game_answer(request, kargs):
    try:
        game = Game.objects.get(id=kargs.get('game_id', ''))
    except Game.DoesNotExist:
        return Response(
            {'error': "Requested game doesn't exist."},
            status=status.HTTP_400_BAD_REQUEST
        )
    try:
        user = User.objects.get(id=kargs.get('user_id', ''))
    except User.DoesNotExist:
        return Response(
            {'error': "Requested user doesn't exist."},
            status=status.HTTP_400_BAD_REQUEST
        )

    answers = request.data.getlist('answers')

    # Populate the game scenes
    game_scenes = GameSceneSerializer(GameScene.objects.filter(game=game), many=True).data
    scenes = {str(scene['id']): scene for scene in iter(game_scenes)}
    if GameAnswer.objects.filter(user=user, game=game).exists():
        old_answers = GameAnswer.objects.get(user=user, game=game).answers
        update_game_stats(old_answers, game, scenes, -1)
        ending = update_game_stats(answers, game, scenes)
        game.save()
        game_answer = GameAnswer.objects.get(user=user, game=game)
        game_answer.answers = answers
        game_answer.ending = ending if ending else ''
        game_answer.save()
    else:
        ending = update_game_stats(answers, game, scenes)
        game.stats['num_of_responses'] += 1
        game.save()
        game_answer = GameAnswer.objects.create(
            user=User.objects.get(id=kargs.get('user_id', '')),
            game=game,
            answers=answers,
            ending=ending if ending else ''
        )

    # Update game.stats for `ENDING`
    all_answers = GameAnswerSerializer(GameAnswer.objects.filter(game=game), many=True).data
    all_endings = [answer['ending'] for answer in iter(all_answers) if answer['ending'].strip() != '']
    game.stats['answers'][str(game.last_scene)].update(dict(Counter(all_endings)))
    game.save()

    serializer = GameAnswerSerializer(game_answer)
    return Response({'data': serializer.data}, status=status.HTTP_202_ACCEPTED)

def delete_game_answer(request, kargs):
    game_id = kargs.get('game_id', '')
    try:
        game = Game.objects.get(id=game_id)
    except Game.DoesNotExist:
        return Response(
            {'error': "Requested game doesn't exist."},
            status=status.HTTP_400_BAD_REQUEST
        )
    try:
        user = User.objects.get(id=kargs.get('user_id', ''))
    except User.DoesNotExist:
        return Response(
            {'error': "Requested user doesn't exist."},
            status=status.HTTP_400_BAD_REQUEST
        )
    try:
        game_answer = GameAnswer.objects.get(user=user, game=game)
    except GameAnswer.DoesNotExist:
        return Response(
            {'error': "There are no games' responses from this user."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Remove the answers from this game_answer from game's stats
    answers = game_answer.answers

    # Populate the game scenes
    game_scenes = GameSceneSerializer(GameScene.objects.filter(game=game), many=True).data
    scenes = {str(scene['id']): scene for scene in iter(game_scenes)}
    update_game_stats(answers, game, scenes, -1)
    game.stats['num_of_responses'] -= 1
    game.save()

    game_answer.delete()
    return Response({}, status=status.HTTP_202_ACCEPTED)


## GET / UPDATE / DELETE GAME ##

def get_game_info(request, kargs):
    game_id = kargs.get('game_id', '')
    try:
        game = Game.objects.get(id=game_id)
    except Game.DoesNotExist:
        return Response(
            {'error': "Requested game doesn't exist."},
            status=status.HTTP_400_BAD_REQUEST
        )

    serializer_class = get_serializer_class(request.user)
    game_data = serializer_class(game).data

    # Not just the Game itself, but all its GameScene and GameAnswer
    all_scenes = GameScene.objects.filter(game=game)
    all_answers = GameAnswer.objects.filter(game=game)
    game_data['scenes'] = populate_dict_from_list(GameSceneSerializer(all_scenes, many=True).data)
    game_data['answers'] = populate_dict_from_list(GameAnswerSerializer(all_answers, many=True).data)

    return Response({'data': game_data})

def update_game(request, kargs):
    game_id = kargs.get('game_id', '')

    if not Game.objects.filter(id=game_id).exists():
        return Response(
            {'error': "Requested game doesn't exist."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        # Only update scenes, if a new 'file' exists
        if 'file' in request.FILES:
            # Do not allow update game's questions if there are already responses
            if GameAnswer.objects.filter(game_id=game_id).exists():
                return Response(
                    {'error': 'Cannot update this game because it already has responses. You should either delete all responses, or create a new game.'},
                    status=status.HTTP_405_METHOD_NOT_ALLOWED
                )

            file_obj = request.FILES['file']
            # Parse file
            strings_data = convert_file_bytes_into_list_of_lists(file_obj)
            try:
                # Parse the file, create new scenes and delete old ones
                parse_game_file_to_update(request, strings_data)
            except Exception as exc:
                return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        game = Game.objects.get(id=game_id)
        game_fields = set(Game.__dict__.keys())
        for attr, value in iter(request.data.dict().items()):
            if attr in game_fields:
                if attr == 'group':
                    setattr(game, attr, Group.objects.get(id=value))
                elif attr != 'file' and attr != 'stats':
                    setattr(game, attr, value)

        game.save()
        serializer = GameSuperuserSerializer(game)
        return Response({'data': serializer.data}, status=status.HTTP_202_ACCEPTED)
    except Exception as exc:
        return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

def delete_game(request, kargs):
    game_id = kargs.get('game_id', '')
    try:
        game = Game.objects.get(id=game_id)
    except Game.DoesNotExist:
        return Response(
            {'error': "Requested game doesn't exist."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if str(game.creator.id) != str(request.user.id):
        return Response(
            {'error': "Only the creator can remove the game."},
            status=status.HTTP_403_FORBIDDEN
        )

    game_scenes = GameScene.objects.filter(game__id=game_id)
    if game_scenes.exists():
        game_scenes.delete()
    game.delete()
    return Response({}, status=status.HTTP_202_ACCEPTED)

@api_view(['GET', 'DELETE', 'POST'])
@permission_classes((IsAuthenticated, IsTokenValid))
def game_update(request, **kargs):
    """Get or Update or Delete a game."""

    if request.method != 'GET' and not request.user.is_superuser:
        return Response({'error': "Only Superusers can modify the game's content."}, status=status.HTTP_403_FORBIDDEN)

    function_mappings = {
        'GET': get_game_info,
        'POST': update_game,
        'DELETE': delete_game
    }
    if request.method in function_mappings:
        return function_mappings[request.method](request, kargs)
    return Response({'error': 'Bad request.'}, status=status.HTTP_400_BAD_REQUEST)


## GAME ANSWERS ##

@api_view(['GET', 'POST', 'DELETE'])
@permission_classes((IsAuthenticated, IsTokenValid))
def game_answer(request, **kargs):
    """Get the user's game's answer or submit a new game's answer."""

    if not request.user.is_superuser and kargs.get('user_id', '') != request.user.id:
        return Response({'error': 'Only the user or Superusers can submit answers to this game.'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    function_mappings = {
        'GET': get_game_answer,
        'POST': update_game_answer,
        'DELETE': delete_game_answer
    }

    try:
        if request.method in function_mappings:
            return function_mappings[request.method](request, kargs)
    except Exception as exc:
        return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
    return Response({'error': 'Bad request.'}, status=status.HTTP_400_BAD_REQUEST)


#================================================================================================
# All answers of a game

def get_all_game_answers(request, kargs):
    game_id = kargs.get('game_id', '')
    try:
        game = Game.objects.get(id=game_id)
    except Game.DoesNotExist:
        return Response(
            {'error': "Requested game doesn't exist."},
            status=status.HTTP_400_BAD_REQUEST
        )

    answers = GameAnswer.objects.filter(game__id=game.id)
    serializer = GameAnswerSerializer(answers, many=True)
    return Response({'data': serializer.data})

def delete_all_game_answers(request, kargs):
    game_id = kargs.get('game_id', '')
    try:
        game = Game.objects.get(id=game_id)
    except Game.DoesNotExist:
        return Response(
            {'error': "Requested game doesn't exist."},
            status=status.HTTP_400_BAD_REQUEST
        )

    answers = GameAnswer.objects.filter(game__id=game.id).delete()

    # Reset stats of game
    prev_answers = game.stats['answers']
    game.stats = {
        'num_of_responses': 0,
        'answers': {
            str(index): [0 for _ in range(len(choices))] for index, choices in iter(prev_answers.items())
        }
    }
    game.save()
    return Response(status=status.HTTP_202_ACCEPTED)

@api_view(['GET', 'DELETE'])
@permission_classes((IsAuthenticated, IsTokenValid, IsSuperUser))
def get_delete_game_answers(request, **kargs):

    function_mappings = {
        'GET': get_all_game_answers,
        'DELETE': delete_all_game_answers
    }
    try:
        if request.method in function_mappings:
            return function_mappings[request.method](request, kargs)
    except Exception as exc:
        return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
    return Response({'error': 'Bad request.'}, status=status.HTTP_400_BAD_REQUEST)
