from django.contrib.auth import get_user_model
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from ast import literal_eval
from uuid import UUID

from kidsbook.serializers import *
from kidsbook.models import *
from kidsbook.permissions import *
from kidsbook.utils import *


User = get_user_model()

def get_serializer_class(user):
    if user.role.id <= 1:
        return SurveySuperuserSerializer
    else:
        return SurveySerializer

## SURVEY ##

def get_surveys(request, kargs):
    try:
        groups_user_in = GroupMember.objects.filter(user=request.user).values_list('group', flat=True)
        surveys = Survey.objects.filter(group__in=groups_user_in)
        params = request.query_params
        if 'is_pinned' in params:
            is_pinned = str(params.get('is_pinned', 'false')).lower() == 'true'
            surveys = surveys.filter(is_pinned=is_pinned)
        if 'is_completed' in params:
            is_completed = str(params.get('is_completed', 'false')).lower() == 'true'
            surveys_has_answers = SurveyAnswer.objects.filter(
                survey__in=surveys, user=request.user
            ).values_list('survey', flat=True)

            if is_completed:
                surveys = surveys.filter(id__in=surveys_has_answers)
            else:
                surveys = surveys.exclude(id__in=surveys_has_answers)

        if request.user.role.id <= 1:
            serializer_class = SurveySuperuserSerializer
        else:
            serializer_class = SurveySerializer

        serializer = SurveySerializer(surveys, many=True)
        return Response({'data': serializer.data})
    except Exception as exc:
        return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes((IsAuthenticated, IsTokenValid))
def surveys(request, **kargs):
    """Get all surveys of user or create a new survey."""

    function_mappings = {
        'GET': get_surveys
    }
    if request.method in function_mappings:
        return function_mappings[request.method](request, kargs)
    return Response({'error': 'Bad request.'}, status=status.HTTP_400_BAD_REQUEST)
