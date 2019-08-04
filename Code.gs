/*
 * Slack Sample App
 *
 * Copyright (C) 2019 Erik Kalkoken
 *
 * Sample app demonstrating how to implement a Slack app with Google Apps Script.
 *
 * The Slackk app is implementing a slash command with an API call
 * and can be installed to multiple workspaces via standard "Add to Slack"
 * The app uses a Google sheet as storage for Slack tokens
 * 
**/

// this is the link to the google sheet used as storage
var SHEET_ID = PropertiesService.getScriptProperties().getProperty('SHEET_ID');

// Slack app Oauth parameters
var SLACK_CLIENT_ID = PropertiesService.getScriptProperties().getProperty('SLACK_CLIENT_ID');
var SLACK_CLIENT_SECRET = PropertiesService.getScriptProperties().getProperty('SLACK_CLIENT_SECRET');
var SLACK_SCOPE = "commands,users:read"

// base URL to reach Slack API
var SLACK_API_BASE_URL = "https://slack.com/api/"


// endpoint for alle GET request, e.g. web pages
// shows the 'Add to Slack' link that will start the the oauth process
function doGet(e) {  
  var html = "";
  
  // check if redirect from Slack Oauth
  if (( typeof(e) != "undefined") && ("finish_auth" in e.parameter)) {
    if ("code" in e.parameter) {
      var params = {
        "client_id": SLACK_CLIENT_ID,
        "client_secret": SLACK_CLIENT_SECRET,
        "code": e.parameter["code"]
      }
      var response = slackApiCall("", "oauth.access", params);
      if (response.ok) {
        var teamId = response.team_id;
        var teamName = response.team_name;
        var token = response.access_token;
        storeTeam(teamId, teamName, token)
        html = "App successfullly added to team " + teamName
      } else {
        html = "something went wrong"
      }
    } else {
        html = "installation canceled"
    }    
  } else {
    // show link for adding Slack app as default web page
    url = 'https://slack.com/oauth/authorize?'
      + 'scope=' + SLACK_SCOPE
      + '&client_id=' + SLACK_CLIENT_ID   
    html = '<a href="' + url + '" target="_blank">Add to Slack</a>'   
  }
  return HtmlService.createHtmlOutput(html);
}

// endpoint for slash requests from Slack
function doPost(e) {
  if (typeof(e) != "undefined") {
    var request = e.parameter;
    var userId = request.user_id;
    var teamId = request.team_id;
    var responseText = ""
    
    // try to get token for current team
    team = fetchTeam(teamId);
    if (team == null) {
      responseText = "App is not properly installed";
    } else {    
      var userName = ""
      var response = slackApiCall(team.token, "users.info", {"user": userId});
      if (response.ok) {
        userName = "real_name" in response.user
          ? response.user.real_name
          : response.user.name
         responseText = "Hi there " + userName + "! How is it going?";
      } else {
        responseText = "An internal error occured";      
      }
    }
  }
  var message = {
      "text": responseText
  };
  return ContentService.createTextOutput(JSON.stringify(message))
    .setMimeType(ContentService.MimeType.JSON);
}

// fetches user name from API and returns it
// slackToken, apiMethod are mandatory args
// returns API response as array
// or null on error
function slackApiCall(slackToken, apiMethod, params) {
  if (typeof(slackToken) == "undefined") {
    console.error("slackApiCall: needs to be provided");
    return null;
  }
  if (typeof(apiMethod) == "undefined") {
    console.error("slackApiCall: needs to be provided");
    return null;
  }
  
  // input validation
  var formData = {};
  if (typeof(params) != "undefined") {
    formData = params
  }
  if (slackToken != "") formData["token"] = slackToken;
  
  var params = {
    "method": "post",    
    "payload": formData
  };   
  var httpResponse = UrlFetchApp.fetch(
    SLACK_API_BASE_URL + apiMethod, 
    params
  );
    
  var response = null;
  if (httpResponse.getResponseCode() != 200) {
    console.warn("slackApiCall: Network error when trying to fetch user info from API");
    console.log(httpReponse);    
  }
  else {
    var response = JSON.parse(httpResponse.getContentText());      
    if ( ("ok" in response) && !response.ok) {            
      console.log("API error: " + response.error)
    }
  }
  return response;
}

// try to fetch team from storage by it's id
// will return team as array if found
/// or null if not found
function fetchTeam(teamId) {  
  if (typeof(teamId) == "undefined") {
    console.error("fetchTeam: teamId to be provided");
    return null;
  }
  
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheets()[0];  
  var values = sheet.getRange("A1:C").getValues();
  var team = null;
  
  if (!values) {
    console.log('No data found.');
  } else {
    for (var row = 0; row < values.length; row++) {      
      if (values[row][0] == teamId) {
        team = {
          "teamId": values[row][0],
          "teamName": values[row][1],
          "token": values[row][2],
        }
        break;
      }
    }    
  }
  return team;
}

// stores a team to storage
// will overwrite existing teams with the same id
// all args are mandatory
// does not return anything
function storeTeam(teamId, teamName, token) {
  // input validation
  if (typeof(teamId) == "undefined") {
    console.error("storeTeam: teamId needs to be provided");
    return null;
  }
  if (typeof(teamName) == "undefined") {
    console.error("storeTeam: teamName needs to be provided");
    return null;
  }
  if (typeof(token) == "undefined") {
    console.error("storeTeam: token needs to be provided");
    return null;
  }  
  
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheets()[0];  
  var range = sheet.getRange("A1:C");
  
  // check if existing team needs to be updated    
  var values = range.getValues();
  var rowToUpdate = values.length;  // to add new row at the far end
  if (values) {    
    for (var row = 0; row < values.length; row++) {      
      if (values[row][0] == teamId) {
        rowToUpdate = row + 1; // to overwrite existing row
        break;
      }
      if (values[row][0] == "") {
        rowToUpdate = row + 1;  // to insert new row on the first blank line
        break;
      }
    }    
  }  
  else {    
    rowToUpdate = 1; // no data yet so starting at the top
  }
  var range = sheet.getRange(rowToUpdate, 1, 1, 3);
  range.setValues([
    [teamId, teamName, token]
  ]);    
}


//////////////////////
// tests
//
// needed properties: SLACK_ACCESS_TOKEN, TEST_USER_ID
//

function testGet1() {
   console.log(doGet().getContent());
}

function testGet2() {
  e = {
     "parameter" : {
       "finish_auth": true,
       "code": "abc"
      }
   };
   console.log(doGet(e).getContent());
}

function testPost() {
   userId = PropertiesService.getScriptProperties().getProperty('TEST_USER_ID')
   e = {
     "parameter" : {
       "user_id": userId        
     }
   };
   console.log(doPost(e).getContent());
}

function testGetUserName() {
  slack_token = PropertiesService.getScriptProperties().getProperty('SLACK_ACCESS_TOKEN')
  name = getUserName(
    SLACK_ACCESS_TOKEN,
    PropertiesService.getScriptProperties().getProperty('TEST_USER_ID')
   );
   console.log(name)
}

// testing fetchTeam()
function testFetchTeam() {
  token = fetchTeam("TDUMMY001");
  console.log(token);
}

// testing storeTeam()
function testStoreTeam() {  
  storeTeam("TDUMMY001", "Test Team", "xoxp-test-dummy")
}

function testSlackApiCall() {  
  console.log(slackApiCall(SLACK_ACCESS_TOKEN, "auth.test"));
  userId = PropertiesService.getScriptProperties().getProperty('TEST_USER_ID')
  console.log(slackApiCall(SLACK_ACCESS_TOKEN, "users.info", {"user": userId}));
}
