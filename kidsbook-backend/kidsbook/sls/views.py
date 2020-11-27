from django.contrib.auth import get_user_model

from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response

from kidsbook.integration.sls import convert_sls_user_to_classbuzz, get_sls_user_data
from kidsbook.user.views import generate_token
from kidsbook.models import *
from kidsbook.permissions import *
from kidsbook.serializers import *
from kidsbook.utils import *
from kidsbook.constants import GROUP_CREATOR_BOT_USERNAME

User = get_user_model()


def create_and_add_sls_user_to_his_groups(user, groups):
    """
    Create all the groups the user is in (from SLS)
    and add him to them.
    """
    group_creator_bot = User.objects.get(username=GROUP_CREATOR_BOT_USERNAME)
    for group in groups:
        if "name" not in group:
            continue

        group_description = group["name"]
        if "code" in group and "subject" in group:
            group_description = "{} {}".format(group["code"], group["subject"])

        if not Group.objects.filter(name=group["name"]).exists():
            created_group = Group.objects.create_group(
                name=group["name"],
                description=group_description,
                creator=group_creator_bot,
            )

            # Create a GroupSetting instance
            GroupSettings.objects.create(group=created_group)
        else:
            created_group = Group.objects.get(name=group["name"])

        if not GroupMember.objects.filter(group=created_group, user=user).exists():
            created_group.add_member(user)


@api_view(["POST"])
def login(request):
    """User login from SLS platform. An account on ClassBuzz for the user will be created."""
    request_data = request.data

    if "user-id" not in request_data:
        return Response(
            {"error": 'Missing field "user-id" in the body of the request.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user_id = request_data["user-id"]
    sls_user_data = get_sls_user_data(user_id)

    if not sls_user_data or "errors" in sls_user_data:
        return Response(
            {"error": "Failed to receive the user from SLS."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    user_data = convert_sls_user_to_classbuzz(
        sls_user_data.get("data", {}).get("user", {})
    )

    if not user_data:
        return Response(
            {"error": "Unable to get the user from SLS."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Pop out the unnessary attributes for User's creation
    groups = user_data.pop("groups", [])

    # If the SLS link is already exist, just return the user
    if User.objects.filter(sls_id=user_data["sls_id"]).exists():
        try:
            user = User.objects.get(sls_id=user_data["sls_id"])
            token = generate_token(user)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        # Create all the groups that the user is in
        create_and_add_sls_user_to_his_groups(user, groups)

        serializer = UserSerializer(user)
        return Response({"data": {"user": serializer.data, "token": token}})

    if (
        user_data["email_address"].strip() != ""
        and User.objects.filter(email_address=user_data["email_address"]).exists()
    ):
        user = User.objects.get(email_address=user_data["email_address"])
        del user_data["email_address"]
        for attr, value in user_data.items():
            setattr(user, attr, value)

        try:
            user.save()
            token = generate_token(user)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        # Create all the groups that the user is in
        create_and_add_sls_user_to_his_groups(user, groups)

        serializer = UserSerializer(user)
        return Response({"data": {"user": serializer.data, "token": token}})

    # Create an account if the user has not registed under ClassBuzz
    create_user = User.objects.create_user
    if user_data.get("is_superuser", False):
        create_user = User.objects.create_superuser
    try:
        user = create_user(**user_data)
        token = generate_token(user)
    except Exception as exc:
        return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    # Create all the groups that the user is in
    create_and_add_sls_user_to_his_groups(user, groups)

    serializer = UserSerializer(user)
    return Response(
        {"data": {"user": serializer.data, "token": token}}, status=status.HTTP_200_OK
    )
