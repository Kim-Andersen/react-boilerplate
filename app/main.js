var React = require('react');
var DOM = require('react-dom');
var config = require('./config');
var Api = require('./Api');

Api.on('error', function(err){
	console.error('Api error', err);
});

var todoApi = Api.create(config.apiBaseUrl+'/todos');

todoApi.get('/', function(error, todos){
	if(!error){
		console.log('todos', todos);
	}
});

/*
todoApi.post('/', {text: 'test todo'}, function(err, todos){
	if(!err){
		console.log('Todo posted successfully.');	
	} else {
		console.error('Failed to post todo.');
	}	
});
*/

var api = Api.create(config.apiRoot+'/todos');

var App = require('./App.jsx');
DOM.render(<App/>, document.getElementById('content'));