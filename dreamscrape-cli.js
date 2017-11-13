"use strict";

//=====================================================================
//=====================================================================
//
//		dreamscrape-cli.js
//
//=====================================================================
//=====================================================================


//---------------------------------------------------------------------
//	Includes
//---------------------------------------------------------------------

var npm_process = require('process');
var npm_path = require('path');
var npm_fs = require('fs');
// var npm_crypto = require('crypto');

var npm_fs_extra = require('fs-extra');
var npm_tmp = require('tmp'); // For temp files

var npm_command_line_args = require('command-line-args');
var npm_command_line_usage = require('command-line-usage');

var dreamscrape = require('./dreamscrape.js');
// dreamscrape.engines_folder = npm_path.resolve(__dirname, 'engines');


//---------------------------------------------------------------------
//	Define the command line arguments
//---------------------------------------------------------------------


const usage_definitions = [
{
	name: 'scriptfile',
	description: 'The script containing the steps to execute.',
	alias: 's',
	type: String,
	typeLabel: '[underline]{file}',
	defaultOption: true
},
{
	name: 'jobpath',
	description: 'A folder to copy the job output to when execution completes.',
	alias: 'j',
	type: String,
	typeLabel: '[underline]{path}'
},
{
	name: 'time',
	description: 'Print the number of seconds it took for execution to complete.',
	alias: 't',
	type: Boolean,
	defaultValue: false,
	typeLabel: '[underline]{boolean}'
},
{
	name: 'output',
	description: 'Print the console output from executing the compiled script.',
	alias: 'o',
	type: Boolean,
	defaultValue: false,
	typeLabel: '[underline]{boolean}'
},
{
	name: 'errors',
	description: 'Print any errors from executing the compiled script.',
	alias: 'e',
	type: Boolean,
	defaultValue: false,
	typeLabel: '[underline]{boolean}'
},
{
	name: 'data',
	description: 'Print the data scraped from executing the compiled script.',
	alias: 'd',
	type: Boolean,
	defaultValue: false,
	typeLabel: '[underline]{boolean}'
},
{
	name: 'pristine',
	description: 'Print in pristine format. Do not use any output headings or spacing lines.',
	alias: 'p',
	type: Boolean,
	defaultValue: false,
	typeLabel: '[underline]{boolean}'
},
{
	name: 'compile',
	description: 'Compile only and do not execute. The compiled script will be printed.',
	alias: 'c',
	type: Boolean,
	defaultValue: false,
	typeLabel: '[underline]{boolean}'
},
{
	name: 'help',
	description: 'Print this help.',
	alias: 'h',
	type: Boolean,
	typeLabel: ''
}];


const usage_sections = [
{
	header: 'dreamscrape-cli',
	content: 'Compiles and executes Dreamscrape script files.'
},
{
	header: 'Synopsis',
	content: '$ node dreamscrape-cli.js scriptfile <options>'
},
{
	header: 'Options',
	optionList: usage_definitions
},
{
	content: 'Project home: [underline]{https://github.com/agbowlin/liquicode_dreamscrape}'
}]


const app_options = npm_command_line_args(usage_definitions);

if (app_options.help)
{
	console.log(npm_command_line_usage(usage_sections));
	npm_process.exit(0);
}


// Get the Steps Filename
var steps_filename = '';
if (app_options.scriptfile)
{
	steps_filename = app_options.scriptfile;
	steps_filename = npm_path.resolve(steps_filename);
}
else
{
	console.log(npm_command_line_usage(usage_sections));
	npm_process.exit(0);
}


//---------------------------------------------------------------------
//	Initialize the work directory.
//---------------------------------------------------------------------

var work_directory = npm_tmp.dirSync({ unsafeCleanup: true });
// console.log('Using work directory [' + work_directory.name + ']');


//---------------------------------------------------------------------
//	Load the script and convert to an array of lines/steps.
//---------------------------------------------------------------------

var script_steps = npm_fs.readFileSync(steps_filename).toString().split("\n");

if (app_options.compile)
{
	var script = dreamscrape.CompileSteps(script_steps);
	console.log(script);
	npm_process.exit(0);
}


//---------------------------------------------------------------------
//	Run the script.
//---------------------------------------------------------------------

dreamscrape.RunSteps(
	script_steps,
	work_directory.name,
	function OnStart(Job)
	{
	},
	function OnError(Err)
	{
		console.log('Execution Error:');
		console.log(Err);
		npm_process.exit(0);
	},
	function OnFinish(Job)
	{
		if (app_options.time)
		{
			if (app_options.pristine) { console.log(Job.seconds_elapsed); }
			if (!app_options.pristine) { console.log('Job completed in ' + Job.seconds_elapsed + ' seconds.'); }
			if (!app_options.pristine) { console.log(''); }
		}
		if (app_options.output)
		{
			if (!app_options.pristine) { console.log('Job Output:'); }
			console.log(Job.stdout);
			if (!app_options.pristine) { console.log(''); }
		}
		if (app_options.errors)
		{
			if (!app_options.pristine) { console.log('Job Errors:'); }
			console.log(Job.stderr);
			if (!app_options.pristine) { console.log(''); }
		}
		if (app_options.data)
		{
			// Print the job data.
			if (!app_options.pristine) { console.log('Job Data:'); }
			var job_data_filename = npm_path.join(work_directory.name, 'job_data.json');
			if (npm_fs.existsSync(job_data_filename))
			{
				var data = npm_fs.readFileSync(job_data_filename).toString();
				console.log(data);
			}
			else
			{
				console.log('ERROR: job data file not found. [' + job_data_filename + ']');
			}
			if (!app_options.pristine) { console.log(''); }
		}
		if (app_options.jobpath)
		{
			var job_directory = app_options.jobpath;
			job_directory = npm_path.resolve(job_directory);
			if (!npm_fs.existsSync(job_directory))
			{
				npm_fs.mkdirSync(job_directory);
			}
			npm_fs_extra.copySync(work_directory.name, job_directory);
		}

		// Shutdown.
		npm_process.exit(0);
	});
