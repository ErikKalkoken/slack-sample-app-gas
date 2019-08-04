# slack-sample-app-gas

Slack sample app with Google App Script

## Overview

This is a sample app demonstrating how to implement a Slack app with Google Apps Script.
 
The app is implementing a slash command and is doing a call to the Slack API.
 
It can be installed to multiple workspaces via standard "Add to Slack". It uses a Google sheet as storage for the workspace related information incl. tokens.
 
 ## Setup
 
Here is what you need to run this app:
 
1. Create a Google sheet
 
2. Create a new Goolge Apps Script project
 
3. Copy & paste the code from this repo into your project
 
4. Deploy your project as web app and make sure to enable access to everyone incl. anonymous

5. Create a new Slack app
 
6. Add a slash command and use the URL of your deployed web app as request URL (should be ending with `/exec`)
 
7. Go to Oauth & Permissions and add a redirect URL to your Slack app. It's the URL of your web app extended by `?finish_auth`.
    So the new url should look something like this:
    `https://script.google.com/macros/ ... /exec?finish_auth`
 
8. Add the following script properties to your Google Apps project:
    - SLACK_CLIENT_ID: Is the client ID of your Slack app
    - SLACK_CLIENT_SECRET: Is the client secret of your Slack app
    - SHEET_ID: Is the ID of your Google spreadsheet
   
    >> Tip: You can get the ID for your google spreadsheet from its url. The format is: `https://docs.google.com/spreadsheets/d/{ID}/edit#gid=0`, where `{ID}` is the ID (without the brackets).
   
9. Activate your Slack app for distribution under Manage Distribution
   
  
That's is. You can now access the web page of your Slack app to start the installation to a workspace. Enjoy!
  
