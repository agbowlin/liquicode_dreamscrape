//=====================================================================
//=====================================================================
//
//		scrape-table.js
//
//=====================================================================
//=====================================================================

// Includes

var npm_process = require('process');
var npm_path = require('path');
var npm_fs = require('fs');

var dreamscrape = require('../../dreamscrape.js');
dreamscrape.engines_folder = '../../engines';

var steps_array = [
	"#debug: true",
	"",
	"#=== Navigate to target page.",
	"url: https://www.w3schools.com/html/html_tables.asp",
	"waitfor: table#customers | 3 seconds",
	"snapshot: 000-target-page",
	"",
	"#=== Scrape the table.",
	"scrapetable: table#customers | customers",
	"",
	"#end of script"
];

// var script = dreamscrape.GenerateScript(steps_array);
// console.log(script);

var job_folder = npm_path.resolve('.');
job_folder = npm_path.join(job_folder, 'job');

dreamscrape.RunSteps(
	steps_array,
	job_folder,
	function(Job)
	{
		console.log('Starting job:');
		console.log(Job.steps);
		console.log('');
		console.log('Executing ...');
		console.log('');
	},
	function(Err)
	{
		console.log('Job error:');
		console.log(Err);
		npm_process.exit(0);
	},
	function(Job)
	{
		console.log('Job completed in ' + Job.seconds_elapsed + ' seconds.');
		console.log('');
		console.log('Output:');
		console.log(Job.stdout);
		console.log('');
		console.log('Errors:');
		console.log(Job.stderr);
		npm_process.exit(0);
	});
