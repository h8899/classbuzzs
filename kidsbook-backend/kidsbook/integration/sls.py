from time import sleep

import requests

from kidsbook.integration.constants import (
    SLS_GET_TOKEN_HEADERS,
    SLS_GET_TOKEN_JSON_BODY,
    SLS_GRAPHQL_HEADERS,
    SLS_GRAPHQL_URL,
    SLS_GRAPHQL_USER_QUERY,
    SLS_TOKEN_URL,
)

SLS_TOKEN = None


def __get_sls_token():
    """Get a SLS authorization token."""
    response = requests.post(
        SLS_TOKEN_URL, headers=SLS_GET_TOKEN_HEADERS, json=SLS_GET_TOKEN_JSON_BODY
    )
    if response.status_code != 200:
        return None

    response_data = response.json()
    if "data" not in response_data:
        return None

    return response_data.get("data", {}).get("token")


def get_sls_token(*, retries=5):
    """A wrapper for __get_sls_token to perform exponential backoff."""
    sleep_time = 0.2
    for _ in range(retries):
        token = __get_sls_token()
        if not token:
            sleep(sleep_time)
            sleep_time *= 2
            continue
        return token

    return None


def refresh_sls_token():
    global SLS_TOKEN
    if SLS_TOKEN is None:
        SLS_TOKEN = get_sls_token()


def get_sls_user_data(user_id):
    global SLS_TOKEN
    if not SLS_TOKEN:
        refresh_sls_token()

    headers = SLS_GRAPHQL_HEADERS
    headers["Authorization"] = headers["Authorization"].format(token=SLS_TOKEN)
    response = requests.post(
        SLS_GRAPHQL_URL,
        json={"query": SLS_GRAPHQL_USER_QUERY % user_id},
        headers=headers,
    )

    if 200 <= response.status_code < 300 and "data" in response.json():
        return response.json()

    return None


def convert_sls_user_to_classbuzz(sls_user):
    # Direct mapping
    is_superuser = True if sls_user.get("role", "").lower() == "teacher" else False
    if (
        "uuid" not in sls_user
        or not isinstance(sls_user["uuid"], str)
        or sls_user["uuid"].strip() == ""
    ):
        return None

    # Use UUID for email to ensure the Unique constraint
    uuid = sls_user["uuid"]
    email = sls_user.get("email", "").strip()
    if email == "":
        email = uuid

    user_data = {
        "sls_id": uuid,
        "realname": sls_user.get("name", uuid),
        "username": uuid,
        "is_superuser": is_superuser,
        "email_address": email,  # Not all have emails
        "groups": sls_user.get("groups", []),
    }
    return user_data
