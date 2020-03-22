# guestbook-backend
 NodeJS + Express backend RESTful API service for the guestbook app

<br>
<br>
<br>
<br>
<br>

# API end points

## Get new message
```
GET /notification
```
 Used to update the cliend with brief information about new messages and new users. The client is expected to call this api periodically to stay updated.

 **Required Request Headers**

 | Header | Value |
 |--------|-------|
 | Authorization | Session id token of the authenticated user |

**Responses**


```json
Status: 200 Ok
{

}
```

```json
Status: 204 No Content
```

```json
Status: 401 Unauthorized
```

<br>
<br>
<br>
<br>
<br>


## Send a message
```
POST /message/:Id
```
Used to send a message to a specific user where `Id` is the Id of that user. (Or in the future it will be possible to specifiy a conversation Id istead for conversations with multiple users)

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


## Get unread messages
```
GET /message/:ConversationId?index=:Cursor
```
Used to all messages in `ConversationId` after `Cursor` where `Cursor` is the Id of the last seen message. When `Cursor` is omited, it returns all messages starting from the first message in the specified conversation.

**Required Request Headers**

 | Header | Value |
 |--------|-------|
 | Authorization | Session id token of the message author |

**Response**
```json
Status: 200 OK
{
    
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