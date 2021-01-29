Then install dependencies:

$ cd myapp
$ npm install

On MacOS or Linux, run the app with this command:

$ DEBUG=myapp:* npm start

On Windows Command Prompt, use this command:

> set DEBUG=myapp:* & npm start

On Windows PowerShell, use this command:

PS> $env:DEBUG='myapp:*'; npm start

Then load http://localhost:3000/ in your browser to access the app.

The generated app has the following directory structure: