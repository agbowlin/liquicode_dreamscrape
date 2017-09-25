//=====================================================================
//=====================================================================
//
//		yahoo-search.js
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
	"#=== Go to the search page.",
	"url: http://yahoo.com",
	"waitfor: input#uh-search-box | 3 seconds",
	"snapshot: 000-search-page",
	"",
	"#=== Submit a search query.",
	"sendtext: input#uh-search-box | You're a Peach!",
	"snapshot: 010-search-query",
	"",
	"#=== Do the search.",
	"sendkey: input#uh-search-box | Enter",
	"# waitfor: div#results | 3 seconds",
	"waitfor: div#results div#pagination | 3 seconds",
	"snapshot: 100-search-results",
	"",
	"#=== Scrape some results.",
	"scrapetext: input#yschsp.sbq | search_text",
	"scrapearray: a.ac-algo | href | links",
	"",
	"#end of script"
];

// var script = dreamscrape.CompileSteps(steps_array);
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
