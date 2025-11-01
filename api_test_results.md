# FocusFlow API Test Results

Base URL: http://localhost:8000


================================================================================
## 1. USER ACCOUNT ENDPOINTS
================================================================================


### [GET] /users/

--------------------------------------------------------------------------------
**Status:** 200
```json
[
  {
    "user_id": 310,
    "org_id": -1,
    "team_id": -1,
    "role_id": -1,
    "email": "ethanyww@icloud.com",
    "name": "Ethan Wong",
    "timezone": "Australia/Melbourne",
    "privacy_settings": {
      "working_hours": {
        "end": "17:00",
        "start": "09:00",
        "friday": {
          "end": "17:00",
          "start": "09:00",
          "enabled": true
        },
        "monday": {
          "end": "17:00",
          "start": "09:00",
          "enabled": true
        },
        "sunday": {
          "end": "17:00",
          "start": "09:00",
          "enabled": false
        },
        "tuesday": {
          "end": "17:00",
          "start": "09:00",
          "enabled": true
        },
        "saturday": {
          "end": "17:00",
          "start": "09:00",
          "enabled": false
        },
        "thursday": {
          "end": "17:00",
          "start": "09:00",
          "enabled": true
        },
        "wednesday": {
          "end": "17:00",
          "start": "09:00",
          "enabled": true
        }
      }
    },
    "tool_connections": {},
    "tracking_enabled": true,
    "last_login": "2025-11-01T06:51:04.086000",
    "created_at": "2025-11-01T06:51:04.537273"
  },
  {
    "user_id": 290,
    "org_id": 41,
    "team_id": 85,
    "role_id": 71,
    "email": "dana88@example.org",
    "name": "Anita Quinn",
    "timezone": "Africa/Ndjamena",
    "privacy_settings": {},
    "tool_connections": {},
    "tracking_enabled": true,
    "last_login": "2025-10-30T21:00:07.817528",
    "created_at": "2025-10-30T21:00:07.817534"
  },
  {
    "user_id": 291,
    "org_id": 41,
    "team_id": 85,
    "role_id": 73,
    "email": "bryancarney@example.net",
    "name": "Jeremy Ramirez",
    "timezone": "Pacific/Majuro",
    "privacy_settings": {},
    "tool_connections": {},
    "tracking_enabled": true,
    "last_login": "2025-10-30T21:00:07.832383",
    "created_at": "2025-10-30T21:00:07.832387"
  },
  {
    "user_id": 292,
    "org_id": 41,
    "team_id": 85,
    "role_id": 72,
    "email": "masonamy@example.net",
    "name": "Jeffrey Adkins",
    "timezone": "America/Hermosillo",
    "privacy_settings": {},
    "tool_connections": {},
    "tracking_enabled": true,
    "last_login": "2025-10-30T21:00:07.846738",
    "created_at": "2025-10-30T21:00:07.846741"
  },
  {
    "user_id": 293,
    "org_id": 41,
    "team_id": 86,
    "role_id": 71,
    "email": "greeves@example.org",
    "name": "Joel Peck",
    "timezone": "Asia/Baghdad",
    "privacy_settings": {},
    "tool_connections": {},
    "tracking_enabled": true,
    "last_login": "2025-10-30T21:00:07.861272",
    "created_at": "2025-10-30T21:00:07.861275"
  }
]
```



### [GET] /users/289

--------------------------------------------------------------------------------
**Status:** 200
```json
{
  "user_id": 289,
  "org_id": 41,
  "team_id": 85,
  "role_id": 74,
  "email": "jason42@example.org",
  "name": "Jacob Hall",
  "timezone": "Africa/Blantyre",
  "privacy_settings": {},
  "tool_connections": {
    "61": {
      "config": {
        "auto_sync": true
      },
      "oauth_data": {
        "scope": "read,write"
      },
      "access_token": "test_access_token_xyz",
      "connected_at": "2025-11-01T19:56:23.103477",
      "refresh_token": "test_refresh_token_abc"
    }
  },
  "tracking_enabled": true,
  "last_login": "2025-10-30T21:00:07.789083",
  "created_at": "2025-10-30T21:00:07.789119"
}
```



### [POST] /users/

--------------------------------------------------------------------------------
**Status:** 422
```json
{
  "detail": [
    {
      "type": "missing",
      "loc": [
        "body",
        "team_id"
      ],
      "msg": "Field required",
      "input": {
        "email": "testuser@example.com",
        "name": "Test User",
        "password_hash": "hashed_password_123",
        "org_id": 41,
        "timezone": "America/New_York",
        "tracking_enabled": true
      }
    },
    {
      "type": "missing",
      "loc": [
        "body",
        "role_id"
      ],
      "msg": "Field required",
      "input": {
        "email": "testuser@example.com",
        "name": "Test User",
        "password_hash": "hashed_password_123",
        "org_id": 41,
        "timezone": "America/New_York",
        "tracking_enabled": true
      }
    }
  ]
}
```



================================================================================
## 2. TEAM MEMBERS MANAGEMENT ENDPOINTS
================================================================================


### [GET] /teams/85/members

--------------------------------------------------------------------------------
**Status:** 200
```json
[
  {
    "user_id": 290,
    "org_id": 41,
    "team_id": 85,
    "role_id": 71,
    "email": "dana88@example.org",
    "name": "Anita Quinn",
    "timezone": "Africa/Ndjamena",
    "privacy_settings": {},
    "tool_connections": {},
    "tracking_enabled": true,
    "last_login": "2025-10-30T21:00:07.817528",
    "created_at": "2025-10-30T21:00:07.817534"
  },
  {
    "user_id": 291,
    "org_id": 41,
    "team_id": 85,
    "role_id": 73,
    "email": "bryancarney@example.net",
    "name": "Jeremy Ramirez",
    "timezone": "Pacific/Majuro",
    "privacy_settings": {},
    "tool_connections": {},
    "tracking_enabled": true,
    "last_login": "2025-10-30T21:00:07.832383",
    "created_at": "2025-10-30T21:00:07.832387"
  },
  {
    "user_id": 292,
    "org_id": 41,
    "team_id": 85,
    "role_id": 72,
    "email": "masonamy@example.net",
    "name": "Jeffrey Adkins",
    "timezone": "America/Hermosillo",
    "privacy_settings": {},
    "tool_connections": {},
    "tracking_enabled": true,
    "last_login": "2025-10-30T21:00:07.846738",
    "created_at": "2025-10-30T21:00:07.846741"
  },
  {
    "user_id": 289,
    "org_id": 41,
    "team_id": 85,
    "role_id": 74,
    "email": "jason42@example.org",
    "name": "Jacob Hall",
    "timezone": "Africa/Blantyre",
    "privacy_settings": {},
    "tool_connections": {
      "61": {
        "config": {
          "auto_sync": true
        },
        "oauth_data": {
          "scope": "read,write"
        },
        "access_token": "test_access_token_xyz",
        "connected_at": "2025-11-01T19:56:23.103477",
        "refresh_token": "test_refresh_token_abc"
      }
    },
    "tracking_enabled": true,
    "last_login": "2025-10-30T21:00:07.789083",
    "created_at": "2025-10-30T21:00:07.789119"
  }
]
```



================================================================================
## 3. TEAM REPORTS - MEMBER ACTIVITY ENDPOINTS
================================================================================


### [GET] /team-reports/team/85/members

--------------------------------------------------------------------------------
**Status:** 200
```json
{
  "team_id": 85,
  "members": [
    {
      "user_id": 290,
      "name": "Anita Quinn",
      "email": "dana88@example.org",
      "role_id": 71
    },
    {
      "user_id": 291,
      "name": "Jeremy Ramirez",
      "email": "bryancarney@example.net",
      "role_id": 73
    },
    {
      "user_id": 292,
      "name": "Jeffrey Adkins",
      "email": "masonamy@example.net",
      "role_id": 72
    },
    {
      "user_id": 289,
      "name": "Jacob Hall",
      "email": "jason42@example.org",
      "role_id": 74
    }
  ]
}
```



### [GET] /team-reports/team/85/members?week_start=2025-11-01

--------------------------------------------------------------------------------
**Status:** 200
```json
{
  "team_id": 85,
  "members": [
    {
      "user_id": 290,
      "name": "Anita Quinn",
      "email": "dana88@example.org",
      "role_id": 71,
      "weekly_summary": null
    },
    {
      "user_id": 291,
      "name": "Jeremy Ramirez",
      "email": "bryancarney@example.net",
      "role_id": 73,
      "weekly_summary": null
    },
    {
      "user_id": 292,
      "name": "Jeffrey Adkins",
      "email": "masonamy@example.net",
      "role_id": 72,
      "weekly_summary": null
    },
    {
      "user_id": 289,
      "name": "Jacob Hall",
      "email": "jason42@example.org",
      "role_id": 74,
      "weekly_summary": null
    }
  ]
}
```



### [GET] /team-reports/team/85/activity

--------------------------------------------------------------------------------
**Status:** 200
```json
{
  "team_id": 85,
  "user_id": null,
  "week_start": null,
  "activity_count": 41,
  "activities": [
    {
      "log_id": 1292,
      "user_id": 290,
      "user_name": "Anita Quinn",
      "tool_id": 61,
      "template_id": 66,
      "event_time": "2025-10-30T15:00:08.396644",
      "minutes": 15,
      "title": "Developer GitHub Task",
      "metadata": {},
      "status": "completed"
    },
    {
      "log_id": 1276,
      "user_id": 289,
      "user_name": "Jacob Hall",
      "tool_id": 64,
      "template_id": 70,
      "event_time": "2025-10-30T13:00:08.160122",
      "minutes": 88,
      "title": "Sales Zoom Task",
      "metadata": {},
      "status": "completed"
    },
    {
      "log_id": 1291,
      "user_id": 290,
      "user_name": "Anita Quinn",
      "tool_id": 61,
      "template_id": 66,
      "event_time": "2025-10-30T12:00:08.382773",
      "minutes": 15,
      "title": "Developer GitHub Task",
      "metadata": {},
      "status": "completed"
    },
    {
      "log_id": 1281,
      "user_id": 289,
      "user_name": "Jacob Hall",
      "tool_id": 64,
      "template_id": 70,
      "event_time": "2025-10-30T08:00:08.243794",
      "minutes": 88,
      "title": "Sales Zoom Task",
      "metadata": {},
      "status": "completed"
    },
    {
      "log_id": 1286,
      "user_id": 289,
      "user_name": "Jacob Hall",
      "tool_id": 64,
      "template_id": 70,
      "event_time": "2025-10-30T05:00:08.313119",
      "minutes": 88,
      "title": "Sales Zoom Task",
      "metadata": {},
      "status": "completed"
    },
    {
      "log_id": 1305,
      "user_id": 291,
      "user_name": "Jeremy Ramirez",
      "tool_id": 63,
      "template_id": 68,
      "event_time": "2025-10-30T02:00:08.578219",
      "minutes": 79,
      "title": "Project Manager Slack Task",
      "metadata": {},
      "status": "completed"
    },
    {
      "log_id": 1293,
      "user_id": 290,
      "user_name": "Anita Quinn",
      "tool_id": 61,
      "template_id": 66,
      "event_time": "2025-10-29T23:00:08.410629",
      "minutes": 15,
      "title": "Developer GitHub Task",
      "metadata": {},
      "status": "completed"
    },
    {
      "log_id": 1300,
      "user_id": 291,
      "user_name": "Jeremy Ramirez",
      "tool_id": 63,
      "template_id": 68,
      "event_time": "2025-10-29T22:00:08.508622",
      "minutes": 79,
      "title": "Project Manager Slack Task",
      "metadata": {},
      "status": "completed"
    },
    {
      "log_id": 1313,
      "user_id": 292,
      "user_name": "Jeffrey Adkins",
      "tool_id": 62,
      "template_id": 67,
      "event_time": "2025-10-29T16:00:08.689115",
      "minutes": 78,
      "title": "Designer Figma Task",
      "metadata": {},
      "status": "completed"
    },
    {
      "log_id": 1308,
      "user_id": 291,
      "user_name": "Jeremy Ramirez",
      "tool_id": 63,
      "template_id": 68,
      "event_time": "2025-10-29T16:00:08.620434",
      "minutes": 79,
      "title": "Project Manager Slack Task",
      "metadata": {},
      "status": "completed"
    },
    {
      "log_id": 1303,
      "user_id": 291,
      "user_name": "Jeremy Ramirez",
      "tool_id": 63,
      "template_id": 68,
      "event_time": "2025-10-29T11:00:08.550583",
      "minutes": 79,
      "title": "Project Manager Slack Task",
      "metadata": {},
      "status": "completed"
    },
    {
      "log_id": 1296,
      "user_id": 290,
      "user_name": "Anita Quinn",
      "tool_id": 61,
      "template_id": 66,
      "event_time": "2025-10-29T09:00:08.452165",
      "minutes": 15,
      "title": "Developer GitHub Task",
      "metadata": {},
      "status": "completed"
    },
    {
      "log_id": 1287,
      "user_id": 289,
      "user_name": "Jacob Hall",
      "tool_id": 64,
      "template_id": 70,
      "event_time": "2025-10-29T08:00:08.326978",
      "minutes": 88,
      "title": "Sales Zoom Task",
      "metadata": {},
      "status": "completed"
    },
    {
      "log_id": 1307,
      "user_id": 291,
      "user_name": "Jeremy Ramirez",
      "tool_id": 65,
      "template_id": 69,
      "event_time": "2025-10-29T06:00:08.606205",
      "minutes": 21,
      "title": "Project Manager Trello Task",
      "metadata": {},
      "status": "completed"
    },
    {
      "log_id": 1289,
      "user_id": 290,
      "user_name": "Anita Quinn",
      "tool_id": 61,
      "template_id": 66,
      "event_time": "2025-10-29T04:00:08.354674",
      "minutes": 15,
      "title": "Developer GitHub Task",
      "metadata": {},
      "status": "completed"
    },
    {
      "log_id": 1316,
      "user_id": 292,
      "user_name": "Jeffrey Adkins",
      "tool_id": 62,
      "template_id": 67,
      "event_time": "2025-10-28T12:00:08.731588",
      "minutes": 78,
      "title": "Designer Figma Task",
      "metadata": {},
      "status": "completed"
    },
    {
      "log_id": 1285,
      "user_id": 289,
      "user_name": "Jacob Hall",
      "tool_id": 64,
      "template_id": 70,
      "event_time": "2025-10-28T10:00:08.299245",
      "minutes": 88,
      "title": "Sales Zoom Task",
      "metadata": {},
      "status": "completed"
    },
    {
      "log_id": 1282,
      "user_id": 289,
      "user_name": "Jacob Hall",
      "tool_id": 64,
      "template_id": 70,
      "event_time": "2025-10-28T05:00:08.257709",
      "minutes": 88,
      "title": "Sales Zoom Task",
      "metadata": {},
      "status": "completed"
    },
    {
      "log_id": 1306,
      "user_id": 291,
      "user_name": "Jeremy Ramirez",
      "tool_id": 63,
      "template_id": 68,
      "event_time": "2025-10-28T00:00:08.592168",
      "minutes": 79,
      "title": "Project Manager Slack Task",
      "metadata": {},
      "status": "completed"
    },
    {
      "log_id": 1294,
      "user_id": 290,
      "user_name": "Anita Quinn",
      "tool_id": 61,
      "template_id": 66,
      "event_time": "2025-10-27T19:00:08.424589",
      "minutes": 15,
      "title": "Developer GitHub Task",
      "metadata": {},
      "status": "completed"
    },
    {
      "log_id": 1290,
      "user_id": 290,
      "user_name": "Anita Quinn",
      "tool_id": 61,
      "template_id": 66,
      "event_time": "2025-10-27T13:00:08.368624",
      "minutes": 15,
      "title": "Developer GitHub Task",
      "metadata": {},
      "status": "completed"
    },
    {
      "log_id": 1301,
      "user_id": 291,
      "user_name": "Jeremy Ramirez",
      "tool_id": 65,
      "template_id": 69,
      "event_time": "2025-10-27T12:00:08.522663",
      "minutes": 21,
      "title": "Project Manager Trello Task",
      "metadata": {},
      "status": "completed"
    },
    {
      "log_id": 1310,
      "user_id": 291,
      "user_name": "Jeremy Ramirez",
      "tool_id": 65,
      "template_id": 69,
      "event_time": "2025-10-27T07:00:08.648119",
      "minutes": 21,
      "title": "Project Manager Trello Task",
      "metadata": {},
      "status": "completed"
    },
    {
      "log_id": 1312,
      "user_id": 292,
      "user_name": "Jeffrey Adkins",
      "tool_id": 62,
      "template_id": 67,
      "event_time": "2025-10-27T02:00:08.675646",
      "minutes": 78,
      "title": "Designer Figma Task",
      "metadata": {},
      "status": "completed"
    },
    {
      "log_id": 1309,
      "user_id": 291,
      "user_name": "Jeremy Ramirez",
      "tool_id": 63,
      "template_id": 68,
      "event_time": "2025-10-26T18:00:08.634562",
      "minutes": 79,
      "title": "Project Manager Slack Task",
      "metadata": {},
      "status": "completed"
    },
    {
      "log_id": 1288,
      "user_id": 290,
      "user_name": "Anita Quinn",
      "tool_id": 61,
      "template_id": 66,
      "event_time": "2025-10-26T16:00:08.340627",
      "minutes": 15,
      "title": "Developer GitHub Task",
      "metadata": {},
      "status": "completed"
    },
    {
      "log_id": 1315,
      "user_id": 292,
      "user_name": "Jeffrey Adkins",
      "tool_id": 62,
      "template_id": 67,
      "event_time": "2025-10-26T15:00:08.717103",
      "minutes": 78,
      "title": "Designer Figma Task",
      "metadata": {},
      "status": "completed"
    },
    {
      "log_id": 1314,
      "user_id": 292,
      "user_name": "Jeffrey Adkins",
      "tool_id": 62,
      "template_id": 67,
      "event_time": "2025-10-26T02:00:08.703238",
      "minutes": 78,
      "title": "Designer Figma Task",
      "metadata": {},
      "status": "completed"
    },
    {
      "log_id": 1297,
      "user_id": 290,
      "user_name": "Anita Quinn",
      "tool_id": 61,
      "template_id": 66,
      "event_time": "2025-10-25T20:00:08.466184",
      "minutes": 15,
      "title": "Developer GitHub Task",
      "metadata": {},
      "status": "completed"
    },
    {
      "log_id": 1280,
      "user_id": 289,
      "user_name": "Jacob Hall",
      "tool_id": 64,
      "template_id": 70,
      "event_time": "2025-10-25T19:00:08.229732",
      "minutes": 88,
      "title": "Sales Zoom Task",
      "metadata": {},
      "status": "completed"
    },
    {
      "log_id": 1277,
      "user_id": 289,
      "user_name": "Jacob Hall",
      "tool_id": 64,
      "template_id": 70,
      "event_time": "2025-10-25T19:00:08.187642",
      "minutes": 88,
      "title": "Sales Zoom Task",
      "metadata": {},
      "status": "completed"
    },
    {
      "log_id": 1302,
      "user_id": 291,
      "user_name": "Jeremy Ramirez",
      "tool_id": 65,
      "template_id": 69,
      "event_time": "2025-10-25T14:00:08.536600",
      "minutes": 60,
      "title": "Updated Activity Title",
      "metadata": {
        "notes": "Updated via API test"
      },
      "status": "published"
    },
    {
      "log_id": 1299,
      "user_id": 291,
      "user_name": "Jeremy Ramirez",
      "tool_id": 63,
      "template_id": 68,
      "event_time": "2025-10-24T23:00:08.494759",
      "minutes": 79,
      "title": "Project Manager Slack Task",
      "metadata": {},
      "status": "completed"
    },
    {
      "log_id": 1283,
      "user_id": 289,
      "user_name": "Jacob Hall",
      "tool_id": 64,
      "template_id": 70,
      "event_time": "2025-10-24T20:00:08.271467",
      "minutes": 88,
      "title": "Sales Zoom Task",
      "metadata": {},
      "status": "completed"
    },
    {
      "log_id": 1284,
      "user_id": 289,
      "user_name": "Jacob Hall",
      "tool_id": 64,
      "template_id": 70,
      "event_time": "2025-10-24T17:00:08.285266",
      "minutes": 88,
      "title": "Sales Zoom Task",
      "metadata": {},
      "status": "completed"
    },
    {
      "log_id": 1279,
      "user_id": 289,
      "user_name": "Jacob Hall",
      "tool_id": 64,
      "template_id": 70,
      "event_time": "2025-10-24T17:00:08.215748",
      "minutes": 88,
      "title": "Sales Zoom Task",
      "metadata": {},
      "status": "completed"
    },
    {
      "log_id": 1278,
      "user_id": 289,
      "user_name": "Jacob Hall",
      "tool_id": 64,
      "template_id": 70,
      "event_time": "2025-10-24T14:00:08.201794",
      "minutes": 88,
      "title": "Sales Zoom Task",
      "metadata": {},
      "status": "completed"
    },
    {
      "log_id": 1295,
      "user_id": 290,
      "user_name": "Anita Quinn",
      "tool_id": 61,
      "template_id": 66,
      "event_time": "2025-10-24T13:00:08.438322",
      "minutes": 15,
      "title": "Developer GitHub Task",
      "metadata": {},
      "status": "completed"
    },
    {
      "log_id": 1311,
      "user_id": 291,
      "user_name": "Jeremy Ramirez",
      "tool_id": 63,
      "template_id": 68,
      "event_time": "2025-10-24T12:00:08.661924",
      "minutes": 79,
      "title": "Project Manager Slack Task",
      "metadata": {},
      "status": "completed"
    },
    {
      "log_id": 1298,
      "user_id": 291,
      "user_name": "Jeremy Ramirez",
      "tool_id": 65,
      "template_id": 69,
      "event_time": "2025-10-24T04:00:08.480132",
      "minutes": 21,
      "title": "Project Manager Trello Task",
      "metadata": {},
      "status": "completed"
    },
    {
      "log_id": 1304,
      "user_id": 291,
      "user_name": "Jeremy Ramirez",
      "tool_id": 65,
      "template_id": 69,
      "event_time": "2025-10-23T22:00:08.564496",
      "minutes": 21,
      "title": "Project Manager Trello Task",
      "metadata": {},
      "status": "completed"
    }
  ]
}
```



### [GET] /team-reports/team/85/activity?user_id=289&week_start=2025-11-01

--------------------------------------------------------------------------------
**Status:** 200
```json
{
  "team_id": 85,
  "user_id": 289,
  "week_start": "2025-11-01",
  "activity_count": 0,
  "activities": []
}
```



================================================================================
## 4. INTEGRATIONS ENDPOINTS
================================================================================


### [GET] /integrations/user/289

--------------------------------------------------------------------------------
**Status:** 200
```json
[
  {
    "tool_id": 61,
    "tool_name": "GitHub",
    "connected": true,
    "connection_data": {
      "config": {
        "auto_sync": true
      },
      "oauth_data": {
        "scope": "read,write"
      },
      "access_token": "test_access_token_xyz",
      "connected_at": "2025-11-01T19:56:23.103477",
      "refresh_token": "test_refresh_token_abc"
    }
  },
  {
    "tool_id": 62,
    "tool_name": "Figma",
    "connected": false,
    "connection_data": {}
  },
  {
    "tool_id": 63,
    "tool_name": "Slack",
    "connected": false,
    "connection_data": {}
  },
  {
    "tool_id": 64,
    "tool_name": "Zoom",
    "connected": false,
    "connection_data": {}
  },
  {
    "tool_id": 65,
    "tool_name": "Trello",
    "connected": false,
    "connection_data": {}
  }
]
```



### [GET] /integrations/61/user/289

--------------------------------------------------------------------------------
**Status:** 200
```json
{
  "tool_id": 61,
  "tool_name": "GitHub",
  "connected": true,
  "connection_data": {
    "config": {
      "auto_sync": true
    },
    "oauth_data": {
      "scope": "read,write"
    },
    "access_token": "test_access_token_xyz",
    "connected_at": "2025-11-01T19:56:23.103477",
    "refresh_token": "test_refresh_token_abc"
  }
}
```



### [POST] /integrations/61/connect

--------------------------------------------------------------------------------
**Status:** 400
```json
{
  "detail": "Integration already connected"
}
```



### [PUT] /integrations/61/update

--------------------------------------------------------------------------------
**Status:** 200
```json
{
  "message": "Integration updated successfully",
  "tool_id": 61,
  "tool_name": "GitHub",
  "user_id": 289
}
```



================================================================================
## 5. CALENDAR ENDPOINTS
================================================================================


### [GET] /calendar/user/289/week/2025-11-01

--------------------------------------------------------------------------------
**Status:** 200
```json
{
  "user_id": 289,
  "week_start": "2025-11-01",
  "week_end": "2025-11-08",
  "total_minutes": 0,
  "total_activities": 0,
  "published": false,
  "entries": []
}
```



### [GET] /calendar/user/289/date/2025-11-01

--------------------------------------------------------------------------------
**Status:** 200
```json
{
  "user_id": 289,
  "date": "2025-11-01",
  "total_minutes": 0,
  "total_activities": 0,
  "entries": []
}
```



### [PUT] /calendar/1302

--------------------------------------------------------------------------------
**Status:** 200
```json
{
  "message": "Calendar entry updated successfully",
  "log_id": 1302,
  "minutes": 60,
  "title": "Updated Activity Title",
  "status": "in_progress"
}
```



### [POST] /calendar/1302/publish

--------------------------------------------------------------------------------
**Status:** 200
```json
{
  "message": "Calendar entry published successfully",
  "log_id": 1302,
  "status": "published"
}
```



### [POST] /calendar/user/289/week/2025-11-01/publish

--------------------------------------------------------------------------------
**Status:** 404
```json
{
  "detail": "Weekly report not found. Generate report first."
}
```



================================================================================
## TEST SUITE COMPLETED
================================================================================

✓ All endpoint tests executed

Note: Some tests are commented out (DELETE operations).
