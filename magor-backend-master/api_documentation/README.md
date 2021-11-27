# Magor 2020 API Documentation

## Login

### Request

```
POST http://magor-sge.speechlab.sg/api/login
Content-Type: application/json

Body:
{
    email: String,
    password: String,
}
```

### Response

#### Valid User

```
200
{
    token: $authToken,
    user: {
        _id: String,
        name: String,
        email: String,
        role: enum('admin', 'uploader', 'user')
    }
}
```

#### Invalid Credentials

```
404 (User Not Found), 409 (Wrong Password)
{
    errors: {
        msg: $errorDescription,
    }
}
```

## Check current user

### Request

```
GET http://magor-sge.speechlab.sg/api/
Authorization: Bearer $authToken
```

### Response (Logged In)

```
200
{
    role: enum('admin', 'uploader', 'user'),
    name: String,
    email: String,
}
```

### Response (Not logged In)

```
404
{
    error: "Not Found"
}
```

## Upload Recording

### Request

```
POST http://magor-sge.speechlab.sg/api/recordings/uploadRecording
Authorization: Bearer $authToken
Content-Type: form/multipart

Body:
    recording: FILE
```

### Response (Success)

```
200
{
    path: $recordingPath,
}
```

### Response (Error)

```
422
{
    error: {
        msg: $errorMessage,
    }
}
```

## Upload a Transcript

### Request

```
POST http://magor-sge.speechlab.sg/api/recordings/uploadTranscript
Authorization: Bearer $authToken
Content-Type: form/multipart

Body:
    transcript: FILE
```

### Response (Success)

```
200
{
    path: $transcriptPath,
}
```

### Response (Error)

```
422
{
    error: {
        msg: $errorMessage,
    }
}
```

## Create a Recording

### Request

```
POST http://magor-sge.speechlab.sg/api/recordings/
Authorization: Bearer $authToken (must be admin or uploader)
Content-Type: application/json

Body:
{
    title: String, (non-empty string)
    description: String, (might be empty)
    path: String($recordingPath),
    transcripts: Array[{
        version: Number,
        name: String, (optional)
        path: {$transcriptPath},
    }], (At least one transcript)
    imageCaptions: Array[{
        ...same as transcripts
    }], (Array can be empty)
    soundCaptions: Array[{
        ...same as transcripts
    }], (Array can be empty)
    tags: Array[{
        tagName: String
    }], (Array can be empty)
}
```
