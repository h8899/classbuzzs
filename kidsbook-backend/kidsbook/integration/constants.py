SLS_GET_TOKEN_JSON_BODY = {
    "clientId": "e050615f-805f-11e9-b2cc-06a70799e2d8",
    "clientSecret": "12345678",
    "grantType": "client_credentials",
}

SLS_GET_TOKEN_HEADERS = {
    "Content-Type": "application/json"
}

SLS_GRAPHQL_HEADERS = {
    "Content-Type": "application/json",
    'Authorization': "Bearer {token}"
}

SLS_GRAPHQL_USER_QUERY = """
{
    user(uuid: \"%s\"){
        uuid
        name
        role
        email
        groups(first: 100) {
          name
          code
          subject
        }
    }
}
"""
SLS_GRAPHQL_URL = "https://adf.stg.sls.ufinity.com/apis/v1/graphql"
SLS_TOKEN_URL = "https://adf.stg.sls.ufinity.com/apis/v1/token"
