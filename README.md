# guestbook-backend
 NodeJS + Express backend RESTful API service for the guestbook app

<br>
<br>
<br>
<br>
<br>

# API end points

## Check the availability of a username
```
GET /user/:UserName
```
 Checks if `UserName` is a valid username and not in user

**Responses**


```json
Status: 204 No Content
```

```json
Status: 451 Unavailable
```

<br>
<br>
<br>
<br>
<br>



## Log in
```
POST /user/login
```
 Used to create a new login session for an authenticated user.

 **Note**: Althout the session is created once this API is called with correct parameters, it expects the `ID_TOKEN` to be used with any other API endpoint within 3 minutes or the session will be terminated by revoking the `ID_TOKEN`. This is don't for more safety to prevent session duplication when the server response fails to reach the client and the client send more requests to try again.

 **Required POST parameters**

 | Parameter | Value |
 |--------|-------|
 | username | The unique username of the registered user |
 | password | The password of the registered user |

**Responses**


```json
Status: 200 Ok
{
    token : ID_TOKEN
}
```

```json
Status: 401 Unauthorized
```

<br>
<br>
<br>
<br>
<br>


## Register a new account
```
POST /user/signup
```
 Used to create a new user account and a new login session for the newly authenticated user.

 **Note**: Althout the session is created once this API is called with correct parameters, it expects the `ID_TOKEN` to be used with any other API endpoint within 3 minutes or the session will be terminated by revoking the `ID_TOKEN`. This is don't for more safety to prevent session duplication when the server response fails to reach the client and the client send more requests to try again.

 **Required POST parameters**

 | Parameter | Value |
 |--------|-------|
 | username | An available alphanumeric username not less than 5 letters and not more than 30 |
 | password | The password that will be set for the new user |

**Responses**


```json
Status: 200 Ok
{
    token : ID_TOKEN
}
```

```json
Status: 451 Unavailable
{
    error: "Username already in use"
}
```

```json
Status: 401 Unauthorized
{
    error: "Bad credentials"
}
```

<br>
<br>
<br>
<br>
<br>


## Get new messages or new guests
```
GET /notification?index=UserId
```
 Used to update the cliend side with brief information about new/unread messages and possibly new users too. if `UserId` is set, it will return any new users registered after the user with the id `UserId`. If omitted, it will return all users from the begining, in addition to unread messages. The client is expected to load the initial content of the app be calling this endpoint without `UserId` at first and to call it periodically with `UserId` of the last guest loaded on the client side to stay updated.

 **Note**: The messages array returned by this endpoint does NOT contain messages contents but only header information of the messages. To get the content of the messages refer to the *get unread messages* endpoint

 **Required Request Headers**

 | Header | Value |
 |--------|-------|
 | Authorization | Session id token of the authenticated user |

**Responses**


```json
Status: 200 Ok
{
    users : [
        {
            username : USERNAME,
            id : USER_ID
        },
        {
            username : USERNAME,
            id : USER_ID 
        }...
    ],
    messages : [
        {
            sender : USERNAME,
            id : CONVERSATION_ID
        },
        {
            sender : USERNAME,
            id : CONVERSATION_ID
        }...
    ]
}
```

```json
Status: 204 No Content
```

```json
Status: 401 Unauthorized
```

```json
Status: 404 Not Found
```

<br>
<br>
<br>
<br>
<br>


## Send a message
```
POST /message/:ConversationId
```
Used to send a message to a specific chat where `ConversationId` can be generated as the result of contatenating both the Ids of the two users starting this conversation after sorting the ids ascendingly. (this way it's possible to use the same converation Id for a conversation between more than two users in case the app is to be updated to support this feature)

**Required Request Headers**

 | Header | Value |
 |--------|-------|
 | Authorization | Session id token of the message author |

**Response**

```json
Status: 200 OK
{
    id : MESSAGE_ID
}
```

```json
Status: 401 Unauthorized
{
    error : "Either the Authorization header is not set or not valid"
}
```

```json
Status: 404 Not Found
{
    error: "Invalid 'Id' parameter"
}
```

<br>
<br>
<br>
<br>
<br>


## Get unread messages
```
GET /messages/:ConversationId?index=:MessageId
```
Used to get all messages in `ConversationId` after the message of id `MessageId` where `MessageId` is the Id of the last seen message. When `MessageId` is omited, it returns all messages starting from the first message in the specified conversation.

**Note**: Please note that this endpoint is /message**s** (plural) in contrary to all other /message end points. That's because this is the only endpoint where there's more than one message in context.

**Required Request Headers**

 | Header | Value |
 |--------|-------|
 | Authorization | Session id token of the message author |

**Response**
```json
Status: 200 OK
{
    messages : [
        ...
    ]
}
```

```json
Status: 204 No Content
```

```json
Status: 401 Unauthorized
```

```json
Status: 404 Not Found
```

<br>
<br>
<br>
<br>
<br>


## Edit a message
```
PATCH /message/:MessageId
```
Used to edit the message if Id `MessageId`.

**Required Request Headers**

 | Header | Value |
 |--------|-------|
 | Authorization | Session id token of the message author |

**Response**
```json
Status: 204 No Content
```

```json
Status: 401 Unauthorized
```

```json
Status: 404 Not Found
```

<br>
<br>
<br>
<br>
<br>


## Delete a message
```
DELETE /message/:MessageId
```
Used to delete a message.

**Required Request Headers**

 | Header | Value |
 |--------|-------|
 | Authorization | Session id token of the message author |

**Response**
```json
Status: 204 No Content
```

```json
Status: 401 Unauthorized
```

```json
Status: 404 Not Found
```