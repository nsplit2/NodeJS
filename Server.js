var exec = require('child_process').execSync;
var fs = require('fs');
var http = require("http");

var server = http.createServer()
  , url = require('url')
  , WebSocketServer = require('ws').Server
  , wss = new WebSocketServer({server: server, path: '/stream'})
  , express = require('express')
  , app = express()
  , port = 81;

server.on('request', app);

server.listen(81, '127.0.0.1', function () {
        console.log('app listening on port 81');
});

// Load custom modules
var NodeUI = require("Pages.js");
NodeUI.Pages(app);
NodeUI.Config(app);
