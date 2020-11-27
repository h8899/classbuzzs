from csv import reader
from django.contrib.auth import get_user_model
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import FileUploadParser
from rest_framework import status

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


## SPECIFIC SCENE ##

def get_scene(request, kargs):
    scene_id = kargs.get('scene_id', '')
    try:
        scene = GameScene.objects.get(id=scene_id)
    except GameScene.DoesNotExist:
        return Response(
            {'error': "Requested scene doesn't exist."},
            status=status.HTTP_400_BAD_REQUEST
        )

    ending = ''
    try:
        game_answer = GameAnswer.objects.get(user=request.user, game=scene.game)
        ending = game_answer.ending
    except GameAnswer.DoesNotExist:
        pass
    scene_data = GameSceneSerializer(scene).data
    return Response({'data': {'scene': scene_data, 'ending': ending}})

@api_view(['GET'])
@permission_classes((IsAuthenticated, IsTokenValid))
def scene_get(request, **kargs):
    """Get a scene."""

    function_mappings = {
        'GET': get_scene,
    }
    if request.method in function_mappings:
        return function_mappings[request.method](request, kargs)
    return Response({'error': 'Bad request.'}, status=status.HTTP_400_BAD_REQUEST)


## SCENE WITH CONDITIONS

def populate_scenes_to_dict(scenes):
    res = {}
    for _scene in iter(scenes):
        res[str(_scene['id'])] = _scene
    return res


def get_scene_with_conditions(request):
    request_queries = request.query_params
    if 'game_id' not in request_queries:
        return Response({'error': "Field 'game_id' is required to retrieve the scene."}, status=status.HTTP_400_BAD_REQUEST)

    # Check if game exists
    try:
        game = Game.objects.get(id=request_queries.get('game_id'))
    except Game.DoesNotExist:
        return Response(
            {'error': "Requested game doesn't exist."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # If no answers exist, start from first scene
    try:
        user_answer = GameAnswer.objects.get(user=request.user, game=game)
    except GameAnswer.DoesNotExist:
        scene = GameScene.objects.get(id=game.first_scene)
        serializer = GameSceneSerializer(scene)
        return Response({'data': {'scene': serializer.data, 'answers': []}})

    # Populate the scenes and get the first scene
    user_answer = user_answer.answers
    all_scenes = GameSceneSerializer(GameScene.objects.filter(game=game), many=True).data
    all_scenes = populate_scenes_to_dict(all_scenes)
    if str(game.first_scene) not in all_scenes:
        return Response(
            {'error': 'Unable to find the first scene of game {}.'.format(game.id)},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Traverse through the scenes to get the last scene the user is at, from his answers
    cur_scene = all_scenes[str(game.first_scene)]
    for ans in iter(user_answer):
        if cur_scene['is_end']:
            break

        if 0 <= ans < len(cur_scene['choices']):
            next_scene_id = cur_scene['choices'][ans]['pathway']
            cur_scene = all_scenes[next_scene_id]
            continue

        # If invalid scene, return the last available scene
        break

    return Response({'data': {'scene': cur_scene, 'answers': user_answer}})


@api_view(['GET'])
@permission_classes((IsAuthenticated, IsTokenValid))
def scene_main(request):
    """Get a scene."""

    function_mappings = {
        'GET': get_scene_with_conditions,
    }
    if request.method in function_mappings:
        return function_mappings[request.method](request)
    return Response({'error': 'Bad request.'}, status=status.HTTP_400_BAD_REQUEST)
