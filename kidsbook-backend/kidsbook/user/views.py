from datetime import datetime, timezone
import pytz
import time
from django.shortcuts import render
from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.contrib.auth.decorators import login_required, user_passes_test
from rest_framework import permissions

from django.http import (
    HttpResponse, HttpResponseNotFound, JsonResponse
)
from django.contrib.auth.hashers import make_password
from django.contrib.auth import get_user_model, authenticate
import jwt, json
from rest_framework_jwt.utils import jwt_payload_handler
from django.contrib.auth.signals import user_logged_in
from rest_framework import permissions, status
from rest_framework.permissions import IsAuthenticated, AllowAny

from kidsbook.models import *
from kidsbook.serializers import *
from kidsbook.permissions import *
from kidsbook.utils import *
import pdb

# import settings
permission_classes = (permissions.IsAuthenticatedOrReadOnly,)

SECRET_KEY = 'a5)t3&0wu-u*8ti(ru_b72vmz8d3pliuuqh8b7i_t^e(aci-1l'

def generate_token(user):
    payload = jwt_payload_handler(user)
    return jwt.encode(payload, SECRET_KEY)

class LogIn(APIView):
    permission_classes = (AllowAny, )
    def post(self, request):
        email = request.data.get('email_address', None)
        password = request.data.get('password', None)
        if not email or not password:
            res = {'error': 'please provide a email and a password'}
            return Response({'error': res}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

        isAuthenticate = authenticate(email_address=email, password=password)

        if not isAuthenticate:
            res = {'error': ' Wrong email/password'}
            return Response({'error': res}, status=status.HTTP_403_FORBIDDEN)
        user = User.objects.get(email_address=email)

        try:
            token = generate_token(user)
            user_details = {}
            user_details['id'] = str(user.id)
            user_details['token'] = token
            user_logged_in.send(sender=user.__class__,
                                request=request, user=user)
            return Response({'data': user_details}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        res = {'error': 'can not authenticate with the given credentials or the account has been deactivated'}
        return Response({'error': res}, status=status.HTTP_400_BAD_REQUEST)

class LogInAsVirtual(APIView):
    permission_classes = (IsAuthenticated, IsSuperUser, IsTokenValid)

    def post(self, request):
        email = request.data.get('email_address', None)

        # Check if eligible
        if not email or not User.objects.filter(email_address=email).exists():
            return Response({'error': 'The email is invalid.'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

        user = User.objects.get(email_address=email)
        if not user.teacher or user.teacher.id != request.user.id:
            return Response({'error': "The user doesn't have permission to access this user."}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

        try:
            token = generate_token(user)
            user_details = {}
            user_details['name'] = user.username
            user_details['token'] = token
            user_logged_in.send(sender=user.__class__,
                                    request=request, user=user)
            return Response({'data': user_details}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'error': 'Bad Request'}, status=status.HTTP_400_BAD_REQUEST)


class Register(APIView):
    permission_classes = (IsAuthenticated, IsSuperUser, IsTokenValid)
    serializer_class = UserSerializer

    def post(self, request):
        # Make a copy of data, as it is immutable
        request_data = request.data.dict().copy()

        user_role = request_data.pop('type', 'USER')
        teacher = request_data.pop('teacher', None)

        mapping_create = {
            'ADMIN': User.objects.create_superuser,
            'SUPERUSER': User.objects.create_superuser,
            'USER': User.objects.create_user,
            'VIRTUAL_USER': User.objects.create_virtual_user
        }

        if user_role in ('USER', 'VIRTUAL_USER') and not teacher:
            return Response({'error': "A creator's ID is required."}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

        if 'email_address' not in request_data:
            return Response({'error': "Missing username."}, status=status.HTTP_405_METHOD_NOT_ALLOWED)
        elif User.objects.filter(email_address=request_data['email_address']).exists():
            return Response({'error': "The username is already in used."}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

        if 'username' not in request_data:
            return Response({'error': "Missing display name."}, status=status.HTTP_405_METHOD_NOT_ALLOWED)
        elif User.objects.filter(username=request_data['username']).exists():
            return Response({'error': "The display name is already in used."}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

        if teacher:
            try:
                teacher = User.objects.get(id=teacher)
                if teacher.is_superuser:
                    request_data['teacher'] = teacher
                else:
                    return Response({'error': "The teacher is not a superuser"}, status=status.HTTP_405_METHOD_NOT_ALLOWED)
            except Exception:
                return Response({'error': "Invalid teacher's ID."}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

        try:
            user = mapping_create[user_role](**request_data)
        except Exception as exc:
            return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        # group = Group.objects.get(id=request.data['group_id'])
        # group.add_member(user)
        serializer = self.serializer_class(user)
        return Response({'data': serializer.data}, status=status.HTTP_202_ACCEPTED)


class Update(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = UserSerializer
    permission_classes = (IsAuthenticated, IsTokenValid)

    def is_creator_of_user(self, request, target_user_id):
        return User.objects.get(id=target_user_id).teacher and request.user.id == User.objects.get(id=target_user_id).teacher.id

    def user_has_no_groups(self, target_user_id):
        return not GroupMember.objects.filter(user_id=target_user_id).exists()

    def is_user_in_same_group_with_requester(self, request, target_user_id):
        requester_id = request.user.id
        groups_that_request_is_in = GroupMember.objects.filter(user_id=requester_id)

        # Check if the `target_user_id` exists in any groups that the requester is in
        for group in iter(groups_that_request_is_in):
            if GroupMember.objects.filter(user_id=target_user_id, group_id=group.group.id).exists():
                return True
        return False

    def post(self, request, **kargs):
        target_user_id = kargs['pk']
        if not User.objects.filter(id=target_user_id).exists():
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Required Superuser
        keywords_require_superuser = ('email_address', 'realname')
        if any(kw in kargs for kw in iter(keywords_require_superuser)) and not request.user.is_superuser:
            return Response({'error': 'Only superuser and above of this user can edit email, username and real name.'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

        # Permissions - For Superuser
        # - Cannot update other superusers
        # - Anyone in the same group
        # - Anyone that have no group
        # - Anyone he created
        # if User.objects.get(id=target_user_id).teacher and request.user.id != User.objects.get(id=target_user_id).teacher.id and request.user.id != target_user_id:
        #     return Response({'error': 'Only the creator and this user can edit.'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

        target_user = User.objects.get(id=target_user_id)
        if target_user.role.id <= 1 and target_user.id != request.user.id:
            return Response({'error': 'A superuser can only be modified by Admin or himself.'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

        if request.user.role.id == 2 and target_user.id != request.user.id:
            return Response({'error': 'A student cannot modify another user.'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

        if not (self.is_creator_of_user(request, target_user_id)
                or self.user_has_no_groups(target_user_id)
                or self.is_user_in_same_group_with_requester(request, target_user_id)
                or request.user.id == target_user_id):
            return Response({'error': 'Only the creator, superusers in the same group and this user can edit.'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

        # Get all keywords that are not in `keywords_require_superuser`
        allowed_keywords = [ field for field in iter(User.__dict__.keys()) if field not in keywords_require_superuser]

        # If different user_id, the requester must be the creator
        if request.user.id != target_user_id:
            allowed_keywords = set(allowed_keywords + list(keywords_require_superuser))

        # Update the user
        update_data = {
            key: val
            for key, val in iter(request.data.items())
            if key in allowed_keywords
        }

        for attr, value in update_data.items():
            setattr(target_user, attr, value)

        if 'password' in request.data:
            if request.user.id == target_user_id and 'oldPassword' not in request.data:
                return Response({'error': "Field 'oldPassword' is required."}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

            #isAuthenticate = authenticate(email_address=request.data['email'], password=request.data['oldPassword'])
            isAuthenticate = True
            if request.user.id == target_user_id:
                isAuthenticate = authenticate(email_address=target_user.email_address, password=request.data['oldPassword'])

            if not isAuthenticate:
                res = {'error': ' Your old password is incorrect '}
                return Response({'error': res}, status=status.HTTP_405_METHOD_NOT_ALLOWED)
            target_user.set_password(request.data['password'])

        try:
            target_user.save()
        except Exception as exc:
            return Response({'error': str(exc)}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

        serializers = UserSerializer(target_user)
        return Response({'data': serializers.data}, status=status.HTTP_202_ACCEPTED)

class GetGroups(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = (IsAuthenticated, IsTokenValid)

    def list(self, request, **kwargs):
        user_id = kwargs['pk']

        if not User.objects.filter(id=user_id).exists():
            return Response({'error': 'The user doesnt exist.'}, status=status.HTTP_400_BAD_REQUEST)

        group_members = GroupMember.objects.filter(user=user_id)
        group_infos = [
            Group.objects.get(id=group_member.group_id) for group_member in iter(group_members)
        ]

        serializer = GroupSerializer(group_infos, many=True)
        return Response({'data': serializer.data})

class LogOut(generics.ListAPIView):
    permission_class = (IsAuthenticated, IsTokenValid)
    def post(self, request):
        try:
            token = request.META.get('HTTP_AUTHORIZATION')
            BlackListedToken.objects.create(token=token, user=request.user)
            return Response({}, status=status.HTTP_202_ACCEPTED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class RecordTime(APIView):
    permission_classes = (IsAuthenticated, IsTokenValid)
    def post(self, request, **kargs):
        interval = 30
        user_id = request.user.id
        user = User.objects.get(id=user_id)
        tz = pytz.timezone('Asia/Singapore')
        date = datetime.now(tz).date()
        time_elapsed = int(float(request.data['timestamp'])) - user.last_active_time
        if(time_elapsed > 2*interval or time_elapsed < 0):
            new_time = 0
        else:
            new_time = time_elapsed

        if(ScreenTime.objects.filter(user=user, date=date).exists()):
            obj = ScreenTime.objects.get(user=user, date=date)
            setattr(obj, 'total_time', obj.total_time + new_time)
            obj.save()
        else:
            obj = ScreenTime.objects.create(user=user, date=date, total_time=new_time)

        setattr(user, 'last_active_time', int(float(request.data['timestamp'])))
        user.save()
        return Response({'data': user.last_active_time, 'new_time': obj.total_time, 'date': date}, status=status.HTTP_202_ACCEPTED)

class GetInfoUser(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = (IsAuthenticated, IsTokenValid)

    def list(self, request, **kargs):
        # This method may be able to be more optimized

        try:
            user_id = kargs.get('pk', None)
            if user_id:
                user = User.objects.get(id=user_id)
                is_correct_virtual = user.teacher and user.teacher.id == request.user.id
                if(request.user.is_superuser or request.user.id == user.id or is_correct_virtual):
                    self.serializer_class = UserSerializer

                    if('num_days' in request.data):
                        num_days = request.data['num_days']
                    else:
                        num_days = 0
                    time_arr = usage_time(user, num_days)
                else:
                    self.serializer_class = UserPublicSerializer
                    time_arr = []
                serializer = self.serializer_class(user, many=False)
                response_data = serializer.data.copy()

                if('role' in response_data):
                    response_data['role'] = response_data['role']['id']

                groups = response_data['user_groups']
                group_ids = list(map(lambda group: group['id'], groups))

                posts = Post.objects.filter(group__in=group_ids)
                post_data = PostSerializer(posts, many=True).data

                comments = Comment.objects.filter(post__in=posts)
                comment_data = CommentSerializer(comments, many=True).data

                post_like = UserLikePost.objects.filter(post__in=posts)
                post_like_data = PostLikeSerializer(post_like, many=True).data

                comment_like = UserLikeComment.objects.filter(comment__in=comments)
                comment_like_data = CommentLikeSerializer(comment_like, many=True).data

                response_data['stats'] = {}
                user_id = response_data['id']

                for group_id in group_ids:
                    post_ids, user_post_ids = self.get_post_ids_and_user_post_ids_of_user_in_group(post_data, user_id, group_id)
                    comment_ids, user_comment_ids = self.get_comment_ids_and_user_comment_ids_of_user_in_posts(comment_data, user_id, post_ids)

                    likes_post_given, likes_post_received = self.get_post_likes_given_and_received(post_like_data, post_ids, user_post_ids, user_id)
                    likes_comment_given, likes_comment_received = self.get_comment_likes_given_and_received(comment_like_data, comment_ids, user_comment_ids, user_id)

                    response_data['stats'][group_id] = {'num_comments': len(user_comment_ids),
                                                           'num_likes_given': likes_post_given + likes_comment_given,
                                                           'num_likes_received': likes_post_received + likes_comment_received}

                if len(time_arr) > 0:
                    response_data['time_history'] = time_arr
                return Response({'data': response_data})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'error' : 'Bad request.'}, status=status.HTTP_400_BAD_REQUEST)

    def get_post_ids_and_user_post_ids_of_user_in_group(self, post_data, user_id, group_id):
        post_ids = set()
        user_post_ids = set()

        for post in iter(post_data):
            if str(post['group']) == group_id:
                post_id = str(post['id'])
                post_ids.add(post_id)

                if str(post['creator']['id']) == user_id:
                    user_post_ids.add(post_id)

        return post_ids, user_post_ids

    def get_comment_ids_and_user_comment_ids_of_user_in_posts(self, comment_data, user_id, post_ids):
        comment_ids = set()
        user_comment_ids = set()

        for comment in iter(comment_data):
            if str(comment['post']) in post_ids:
                comment_id = str(comment['id'])
                comment_ids.add(comment_id)

                if comment['creator']['id'] == user_id:
                    user_comment_ids.add(comment_id)
        return comment_ids, user_comment_ids

    def get_post_likes_given_and_received(self, post_like_data, post_ids, user_post_ids, user_id):
        num_likes_given = 0
        nums_like_received = 0

        for like in iter(post_like_data):
            post_id = str(like['post']['id'])
            if post_id in user_post_ids:
                nums_like_received += 1

            if post_id in post_ids and str(like['user']['id']) == user_id:
                num_likes_given += 1
        return num_likes_given, nums_like_received

    def get_comment_likes_given_and_received(self, comment_like_data, comment_ids, user_comment_ids, user_id):
        num_likes_given = 0
        nums_like_received = 0

        for like in iter(comment_like_data):
            comment_id = str(like['comment']['id'])
            if comment_id in user_comment_ids:
                nums_like_received += 1

            if comment_id in comment_ids and str(like['user']['id']) == user_id:
                num_likes_given += 1
        return num_likes_given, nums_like_received


class GetPost(generics.ListAPIView):
    queryset = ''
    serializer_class = PostSerializer
    permission_classes = (IsAuthenticated, IsTokenValid)
    def list(self, request, **kargs):
        try:
            user_id = kargs.get('pk', '')
            user = User.objects.get(id=user_id)
            posts = Post.objects.filter(creator=user).exclude(is_deleted=True).order_by('-created_at')
            serializer = PostSerializer(posts, many=True)
            return Response({'data': serializer.data})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class GetVirtualUsers(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = (IsAuthenticated, IsSuperUser, IsTokenValid)
    def list(self, request):
        try:
            current_user = request.user
            virtual_users = User.objects.filter(teacher=current_user, role=3)
            serializer = self.serializer_class(virtual_users, many=True)
            return Response({'data': serializer.data})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class SettingUser(generics.ListAPIView):
    serializer_class = UserSettingSerializer
    permission_classes = (IsAuthenticated, IsTokenValid)

    def list(self, request, **kargs):
        try:
            user_setting = UserSetting.objects.get(user_id=request.user.id)
            serializer = self.serializer_class(user_setting)
            return Response({'data': serializer.data})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request, *args, **kwargs):
        try:
            user_setting = UserSetting.objects.get(user_id=request.user.id)

            setting_fields = set(UserSetting.__dict__.keys())
            for attr, value in iter(request.data.dict().items()):
                if attr in setting_fields:
                    setattr(user_setting, attr, value)
            user_setting.save()

            serializer = self.serializer_class(user_setting)
            return Response({'data': serializer.data}, status=status.HTTP_202_ACCEPTED)
        except Exception as exc:
            return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
