from django.contrib.auth import get_user_model
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from ast import literal_eval

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

def get_survey(request, kargs):
    try:
        surveys = Survey.objects.filter(creator_id=request.user.id)
        serializer = SurveySuperuserSerializer(surveys, many=True)
        return Response({'data': serializer.data})
    except Exception as exc:
        return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

def string_to_dict(text):
    try:
        dict_obj = literal_eval(text)
    except Exception:
        return False, None
    return True, dict_obj


def create_survey(request, kargs):
    if 'group' not in request.data:
        return Response({'error': "Field 'group' of a group_id is required to create a survey."}, status=status.HTTP_400_BAD_REQUEST)
    if 'questions_answers' not in request.data:
        return Response({'error': "Field 'questions_answers' of a list of questions is required and must not be empty to create a survey."}, status=status.HTTP_400_BAD_REQUEST)

    questions = request.data.copy().getlist('questions_answers')

    # Check if the format is an Array of Arrays of Strings
    for index, question in iter(enumerate(questions)):
        if isinstance(question, str):
            valid, dict_obj = string_to_dict(question)
        if not valid and not isinstance(question, dict):
            return Response({'error': 'The questions must in JSON format.'}, status=status.HTTP_400_BAD_REQUEST)
        questions[index] = dict_obj

    # Create a default stats
    default_stats = {
        'num_of_responses': 0,
        'answers': {str(index): [0 for _ in question.get('options', [])] for index, question in iter(enumerate(questions))}
    }

    new_survey = request.data.dict().copy()
    new_survey['creator'] = request.user
    new_survey['stats'] = default_stats
    new_survey['questions_answers'] = questions
    new_survey['group'] = Group.objects.get(id=new_survey['group'])
    new_survey['is_pinned'] = str(new_survey.get('is_pinned', 'false')).lower() == 'true'

    try:
        serializer = SurveySuperuserSerializer(
            Survey.objects.create(**new_survey)
        )
        return Response({'data': serializer.data}, status=status.HTTP_202_ACCEPTED)
    except Exception as exc:
        return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST'])
@permission_classes((IsAuthenticated, IsTokenValid, IsSuperUser))
def survey(request, **kargs):
    """Get all surveys of user or create a new survey."""

    function_mappings = {
        'GET': get_survey,
        'POST': create_survey
    }
    if request.method in function_mappings:
        return function_mappings[request.method](request, kargs)
    return Response({'error': 'Bad request.'}, status=status.HTTP_400_BAD_REQUEST)


## GET / UPDATE / DELETE SURVEY ##

def get_survey_info(request, kargs):
    survey_id = kargs.get('survey_id', '')
    try:
        survey = Survey.objects.get(id=survey_id)
    except Survey.DoesNotExist:
        return Response(
            {'error': "Requested survey doesn't exist."},
            status=status.HTTP_400_BAD_REQUEST
        )

    serializer_class = get_serializer_class(request.user)
    serializer_data = serializer_class(survey).data

    try:
        # Process the query params in the request
        if (
            request.user.is_superuser and
            'question' in request.query_params and
            str(request.query_params['question']).isdigit()
        ):
            question_index = int(request.query_params['question'])
            # If index out of range
            if question_index < 0 or question_index >= len(serializer_data['questions_answers']):
                return Response(
                    {'error': "Index of the question is out of range."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Process the answers
            survey_answers = SurveyAnswer.objects.filter(survey__id=survey_id)
            survey_answers_data = SurveyAnswerSerializer(survey_answers, many=True).data
            answers = {
                    str(survey_answer['user']): survey_answer['answers'][question_index]
                    for survey_answer in iter(survey_answers_data)
            }
            serializer_data['answers'] = answers

            # Process the stats
            serializer_data['stats']['answers'] = serializer_data['stats']['answers'][str(question_index)]
    except Exception as exc:
        return Response(
            {'error': str(exc)},
            status=status.HTTP_400_BAD_REQUEST
        )
    return Response({'data': serializer_data})

def update_survey(request, kargs):
    survey_id = kargs.get('survey_id', '')
    try:
        survey = Survey.objects.get(id=survey_id)
    except Survey.DoesNotExist:
        return Response(
            {'error': "Requested survey doesn't exist."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        # Only update questions and stats, if a new 'questions_answers' exists
        if 'questions_answers' in request.data:
            # Do not allow update survey's questions if there are already responses
            if SurveyAnswer.objects.filter(survey_id=survey_id).exists():
                return Response(
                    {'error': 'Cannot update this survey because it already has responses. You should either delete all responses, or create a new survey.'},
                    status=status.HTTP_405_METHOD_NOT_ALLOWED
                )

            questions = request.data.copy().getlist('questions_answers')

            # Check if the format is an Array of Arrays of Strings
            for index, question in iter(enumerate(questions)):
                if isinstance(question, str):
                    valid, dict_obj = string_to_dict(question)
                if not valid and not isinstance(question, dict):
                    return Response({'error': 'The questions must in JSON format.'}, status=status.HTTP_400_BAD_REQUEST)
                questions[index] = dict_obj

            # Create a new stats
            new_stats = {
                'num_of_responses': 0,
                'answers': {str(index): [0 for _ in question.get('options', [])] for index, question in iter(enumerate(questions))}
            }

            survey.questions_answers = questions
            survey.stats = new_stats

        survey_fields = set(Survey.__dict__.keys())
        for attr, value in iter(request.data.dict().items()):
            if attr in iter(survey_fields):
                if attr == 'group':
                    setattr(survey, attr, Group.objects.get(id=value))
                elif attr == 'is_pinned':
                    setattr(survey, attr, str(value).lower()=='true')
                elif attr != 'questions_answers' and attr != 'stats':
                    setattr(survey, attr, value)

        survey.save()
        serializer = SurveySuperuserSerializer(survey)
        return Response({'data': serializer.data}, status=status.HTTP_202_ACCEPTED)
    except Exception as exc:
        return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

def delete_survey(request, kargs):
    survey_id = kargs.get('survey_id', '')
    try:
        survey = Survey.objects.get(id=survey_id)
    except Survey.DoesNotExist:
        return Response(
            {'error': "Requested survey doesn't exist."},
            status=status.HTTP_400_BAD_REQUEST
        )

    survey.delete()
    return Response({}, status=status.HTTP_202_ACCEPTED)

@api_view(['GET', 'DELETE', 'POST'])
@permission_classes((IsAuthenticated, IsTokenValid))
def survey_update(request, **kargs):
    """Get or Update or Delete a survey."""

    if request.method != 'GET' and not request.user.is_superuser:
        return Response({'error': "Only Superusers can modify the survey's content."}, status=status.HTTP_403_FORBIDDEN)

    function_mappings = {
        'GET': get_survey_info,
        'POST': update_survey,
        'DELETE': delete_survey
    }
    if request.method in function_mappings:
        return function_mappings[request.method](request, kargs)
    return Response({'error': 'Bad request.'}, status=status.HTTP_400_BAD_REQUEST)


## survey's answer ##

def get_survey_answer(request, kargs):
    try:
        survey_answer = SurveyAnswer.objects.get(
            user_id=kargs.get('user_id', ''),
            survey=kargs.get('survey_id', '')
        )
    except SurveyAnswer.DoesNotExist:
        return Response({'error': "There are no surveys' responses from this user."}, status=status.HTTP_400_BAD_REQUEST)

    serializer = SurveyAnswerSerializer(survey_answer)
    return Response({'data': serializer.data})

def update_survey_stats(answers, survey, value=1):
    questions = survey.questions_answers
    survey_stats = survey.stats

    # Update survey's stats and typechecks
    for index, ans in iter(enumerate(answers)):
        # If the question requires an answer
        if str(questions[index].get('required', 'false')).lower() == 'true' and (not ans or ans.strip() == ''):
            raise ValueError('Missing value for question number {}, which is required.'.format(index))

        # If the answer is a dropdown/option type
        if (len(questions[index].get('options',[])) > 0 and ans.strip() != '' and ans
                and ans[0] == '[' and ans[-1] == ']'):
            for option in iter(ans[1:-1].split(',')):
                option = option.strip()
                if option.isdigit():
                    survey_stats['answers'][str(index)][int(option)] += value
                elif option != '':
                    raise ValueError('Value of {} in question number {} must be an integer.'.format(option, index))
            continue

        # If the answer is an integer
        elif isinstance(ans, str):
            # If not text-based input, increase the stats count
            if ans.isdigit() and len(questions[index].get('options',[])) > 0:
                survey_stats['answers'][str(index)][int(ans)] += value
            continue
        elif isinstance(ans, int):
            survey_stats['answers'][str(index)][ans] += value
            continue

        raise ValueError('The answer must either be an integer in string format, string or array, but not {}'.format(type(ans)))

def update_survey_answer(request, kargs):
    try:
        survey = Survey.objects.get(id=kargs.get('survey_id', ''))
    except Survey.DoesNotExist:
        return Response(
            {'error': "Requested survey doesn't exist."},
            status=status.HTTP_400_BAD_REQUEST
        )
    try:
        user = User.objects.get(id=kargs.get('user_id', ''))
    except User.DoesNotExist:
        return Response(
            {'error': "Requested user doesn't exist."},
            status=status.HTTP_400_BAD_REQUEST
        )
    questions = survey.questions_answers
    answers = request.data.getlist('answers')

    if len(answers) != len(questions):
        raise ValueError('There are {} questions in the survey, but {} answers are provided.'.format(len(questions), len(answers)))

    if SurveyAnswer.objects.filter(user=user, survey=survey).exists():
        old_answers = SurveyAnswer.objects.get(user=user, survey=survey).answers
        update_survey_stats(old_answers, survey, -1)
        update_survey_stats(answers, survey)
        survey.save()
        survey_answer = SurveyAnswer.objects.get(user=user, survey=survey)
        survey_answer.answers = answers
        survey_answer.save()
    else:
        update_survey_stats(answers, survey)
        survey.stats['num_of_responses'] += 1
        survey.save()
        survey_answer = SurveyAnswer.objects.create(
            user=User.objects.get(id=kargs.get('user_id', '')),
            survey=survey,
            answers=answers
        )
    serializer = SurveyAnswerSerializer(survey_answer)
    return Response({'data': serializer.data}, status=status.HTTP_202_ACCEPTED)

def delete_survey_answer(request, kargs):
    survey_id = kargs.get('survey_id', '')
    try:
        survey = Survey.objects.get(id=survey_id)
    except Survey.DoesNotExist:
        return Response(
            {'error': "Requested survey doesn't exist."},
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
        survey_answer = SurveyAnswer.objects.get(user=user, survey=survey)
    except SurveyAnswer.DoesNotExist:
        return Response(
            {'error': "There are no surveys' responses from this user."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Remove the answers from this survey_answer from survey's stats
    answers = survey_answer.answers
    update_survey_stats(answers, survey, -1)
    survey.stats['num_of_responses'] -= 1
    survey.save()

    survey_answer.delete()
    return Response({}, status=status.HTTP_202_ACCEPTED)


@api_view(['GET', 'POST', 'DELETE'])
@permission_classes((IsAuthenticated, IsTokenValid))
def survey_answer(request, **kargs):
    """Get the user's survey's answer or submit a new survey's answer."""

    if not request.user.is_superuser and kargs.get('user_id', '') != request.user.id:
        return Response({'error': 'Only the user or Superusers can submit answers to this survey.'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    function_mappings = {
        'GET': get_survey_answer,
        'POST': update_survey_answer,
        'DELETE': delete_survey_answer
    }
    try:
        if request.method in function_mappings:
            return function_mappings[request.method](request, kargs)
    except Exception as exc:
        return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
    return Response({'error': 'Bad request.'}, status=status.HTTP_400_BAD_REQUEST)


#================================================================================================
# All answers of a survey

def get_all_survey_answers(request, kargs):
    survey_id = kargs.get('survey_id', '')
    try:
        survey = Survey.objects.get(id=survey_id)
    except Survey.DoesNotExist:
        return Response(
            {'error': "Requested survey doesn't exist."},
            status=status.HTTP_400_BAD_REQUEST
        )

    answers = SurveyAnswer.objects.filter(survey__id=survey.id)
    serializer = SurveyAnswerSerializer(answers, many=True)
    return Response({'data': serializer.data})

def delete_all_survey_answers(request, kargs):
    survey_id = kargs.get('survey_id', '')
    try:
        survey = Survey.objects.get(id=survey_id)
    except Survey.DoesNotExist:
        return Response(
            {'error': "Requested survey doesn't exist."},
            status=status.HTTP_400_BAD_REQUEST
        )

    answers = SurveyAnswer.objects.filter(survey__id=survey.id).delete()

    # Reset stats of survey
    questions = survey.questions_answers
    survey.stats = {
        'num_of_responses': 0,
        'answers': {str(index): [0 for _ in question.get('options', [])] for index, question in iter(enumerate(questions))}
    }
    survey.save()
    return Response(status=status.HTTP_202_ACCEPTED)

@api_view(['GET', 'DELETE'])
@permission_classes((IsAuthenticated, IsTokenValid, IsSuperUser))
def get_delete_survey_answers(request, **kargs):

    function_mappings = {
        'GET': get_all_survey_answers,
        'DELETE': delete_all_survey_answers
    }
    try:
        if request.method in function_mappings:
            return function_mappings[request.method](request, kargs)
    except Exception as exc:
        return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
    return Response({'error': 'Bad request.'}, status=status.HTTP_400_BAD_REQUEST)
