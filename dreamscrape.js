"use strict";

var npm_process = require('process');
var npm_path = require('path');
var npm_fs = require('fs');
var npm_exec = require('child_process').exec;

var npm_string = require('string');


module.exports = Dreamscrape;


function Dreamscrape() {
	return;
}

Dreamscrape.engines_folder = npm_path.resolve(__dirname, 'engines');


//---------------------------------------------------------------------
Dreamscrape.ScriptError_SyntaxError =
	function ScriptError_SyntaxError(LineNumber, Message) {
		return new Error("Syntax error on line " + LineNumber + ". " + Message);
	};


//---------------------------------------------------------------------
Dreamscrape.ScriptError_InvalidParameters =
	function ScriptError_InvalidParameters(LineNumber, Command) {
		return new Error("Parameter error on line " + LineNumber + ". Invalid parameters for the [" + Command + "] command.");
	};


//---------------------------------------------------------------------
Dreamscrape.ParseTimeout =
	function ParseTimeout(TimeoutText) {
		var text = npm_string(TimeoutText).trim().collapseWhitespace();
		var quantity = text.toFloat();
		if (isNaN(quantity)) {
			return null;
		}
		var ich = text.indexOf(' ');
		if (ich >= 0) {
			var timespan = text.right(text.length - (ich + 1)).toLowerCase();
			if (!timespan || (timespan == 'milliseconds') || (timespan == 'ms')) {
				quantity = quantity * 1;
			}
			else if ((timespan == 'seconds') || (timespan == 's')) {
				quantity = quantity * 1000;
			}
			else {
				return null;
			}
		}
		return quantity;
	};


//---------------------------------------------------------------------
Dreamscrape.CompileSteps =
	function CompileSteps(StepLines) {
		var code = '';
		var log_head_top = '====== ';
		// var log_head_major = '->->-> ';
		var log_head_major = '    -> ';
		var log_head_minor = '       ';
		var log_head_pass = ' PASS  ';
		var log_head_fail = ' FAIL  ';

		var step_lines = StepLines;
		if (typeof step_lines === 'string' || step_lines instanceof String) {
			// Convert string to an array of lines.
			step_lines = npm_string(step_lines).lines();
		}

		// Iterate through lines.
		for (var line_index = 0; line_index < step_lines.length; line_index++) {
			var step = npm_string(step_lines[line_index]).trim();

			// Check for blank lines.
			if (step.length == 0) {
				continue;
			}

			// Document the step.
			code += "\n";
			code += "//=====================================================================\n";
			code += "// " + step + "\n";

			// Check for comment lines.
			if (step.startsWith('#')) {
				continue;
			}

			// Escape all the single quotes.
			step = step.replaceAll("'", "\\\'");

			// Log the step.
			code += "casper.then( function() { Logger.LogMessage( '" + log_head_top + "Executing step [" + step.toString() + "].' ); } );\n";

			// Get the command and the parameters.
			var ich = step.indexOf(':');
			if (ich < 0) {
				throw Dreamscrape.ScriptError_SyntaxError(line_index + 1, "Missing ':'.");
			}
			var command = step.left(ich).trim();
			step = step.right(step.length - (ich + 1)).trim();
			var params = step.split('|');

			// Generate the command script.

			//=====================================================================
			//	Debug Command
			if (command == 'debug') {

				var value = false;
				if (params.length == 1) {
					value = npm_string(params[0]).trim().toBoolean();
				}
				else if (params.length > 1) {
					throw Dreamscrape.ScriptError_InvalidParameters(line_index + 1, command.toString());
				}

				if (value) {
					code += "\n";
					code += "casper.then(\n";
					code += "    function()\n";
					code += "    {\n";
					code += "        casper.options.logLevel = 'debug';\n";
					code += "        casper.options.verbose = true;\n";
					code += "        LOG_PAGE_ERRORS = true;\n";
					code += "        LOG_REMOTE_MESSAGES = true;\n";
					code += "        Logger.LogTimestamp = true;\n";
					code += "    });\n";
				}
				else {
					code += "\n";
					code += "casper.then(\n";
					code += "    function()\n";
					code += "    {\n";
					code += "        casper.options.logLevel = 'error';\n";
					code += "        casper.options.verbose = false;\n";
					code += "        LOG_PAGE_ERRORS = false;\n";
					code += "        LOG_REMOTE_MESSAGES = false;\n";
					code += "        Logger.LogTimestamp = false;\n";
					code += "    });\n";
				}

			}

			//=====================================================================
			//	Url Command
			else if (command == 'url') {

				if (params.length != 1) {
					throw Dreamscrape.ScriptError_InvalidParameters(line_index + 1, command.toString());
				}
				var url = npm_string(params[0]).trim();
				code += "\n";
				code += "casper.thenOpen(\n";
				code += "    '" + url.toString() + "',\n";
				code += "    function()\n";
				code += "    {\n";
				code += "        Logger.LogMessage( '" + log_head_minor + "Opened Url [" + url.toString() + "].' );\n";
				code += "    });\n";

			}

			//=====================================================================
			//	WaitFor Command
			else if (command == 'waitfor') {

				var selector = '';
				var timeout = '';
				if (params.length == 1) {
					timeout = Dreamscrape.ParseTimeout(params[0]);
					if (!timeout) {
						selector = npm_string(params[0]).trim().collapseWhitespace();
					}
				}
				else if (params.length == 2) {
					selector = npm_string(params[0]).trim().collapseWhitespace();
					timeout = Dreamscrape.ParseTimeout(params[1]);
					if (!timeout) {
						throw Dreamscrape.ScriptError_InvalidParameters(line_index + 1, command.toString());
					}
				}

				if (!selector && !timeout) {
					throw Dreamscrape.ScriptError_InvalidParameters(line_index + 1, command.toString());
				}
				else if (selector && timeout) {
					code += "\n";
					code += "casper.waitForSelector(\n";
					code += "    '" + selector.toString() + "',\n";
					code += "    function()\n";
					code += "    {\n";
					code += "        Logger.LogMessage( '" + log_head_pass + "Wait for selector [" + selector.toString() + "] succeeded.' );\n";
					code += "    },\n";
					code += "    function()\n";
					code += "    {\n";
					code += "        Logger.LogMessage( '" + log_head_fail + "Wait for selector [" + selector.toString() + "] failed after [" + timeout.toString() + "] milliseconds.' );\n";
					code += "    },\n";
					code += "    " + timeout.toString() + " );\n";
				}
				else if (selector) {
					code += "\n";
					code += "casper.waitForSelector(\n";
					code += "    '" + selector.toString() + "',\n";
					code += "    function()\n";
					code += "    {\n";
					code += "        Logger.LogMessage( '" + log_head_pass + "Wait for selector [" + selector.toString() + "] succeeded.' );\n";
					code += "    },\n";
					code += "    function()\n";
					code += "    {\n";
					code += "        Logger.LogMessage( '" + log_head_fail + "Wait for selector [" + selector.toString() + "] failed.' );\n";
					code += "    });\n";
				}
				else if (timeout) {
					code += "\n";
					code += "casper.wait(\n";
					code += "    " + timeout.toString() + ",\n";
					code += "    function()\n";
					code += "    {\n";
					code += "        Logger.LogMessage( '" + log_head_pass + "Waited for [" + timeout.toString() + "] milliseconds.' );\n";
					code += "    });\n";
				}

			}

			//=====================================================================
			//	SendText Command
			else if (command == 'sendtext') {

				if (params.length != 2) {
					throw Dreamscrape.ScriptError_InvalidParameters(line_index + 1, command.toString());
				}
				var selector = npm_string(params[0]).trim();
				var text = npm_string(params[1]).trim();
				// text = text.replaceAll("'", "\\\'");

				code += "\n";
				code += "casper.then(\n";
				code += "    function()\n";
				code += "    {\n";
				code += "        Logger.LogMessage( '" + log_head_major + "Sending text [" + text.toString() + "] to selector [" + selector.toString() + "].' );\n";
				code += "        casper.sendKeys( '" + selector.toString() + "', '" + text.toString() + "', { keepFocus: true } );\n";
				code += "    });\n";

			}

			//=====================================================================
			//	SendKey Command
			else if (command == 'sendkey') {
				if (params.length != 2) {
					throw Dreamscrape.ScriptError_InvalidParameters(line_index + 1, command.toString());
				}
				var selector = npm_string(params[0]).trim();
				var key_code = '';
				var modifiers = '';
				var keys = npm_string(params[1]).split('+');
				keys.forEach(
					function(key) {
						key = npm_string(key).trim();
						var lkey = key.toLowerCase();
						if ((lkey == 'ctl') || (lkey == 'ctrl')) {
							if (modifiers) {
								modifiers += '+';
							}
							modifiers += "ctrl";
						}
						else if (lkey == 'alt') {
							if (modifiers) {
								modifiers += '+';
							}
							modifiers += "alt";
						}
						else if (lkey == 'shift') {
							if (modifiers) {
								modifiers += '+';
							}
							modifiers += "shift";
						}
						else {
							key_code = key;
						}
					});

				if (!key_code) {
					throw Dreamscrape.ScriptError_SyntaxError(line_index + 1, "Missing key code.");
				}

				if (modifiers) {
					modifiers = ", modifiers: '" + modifiers + "'";
				}

				//NOTE: Key codes are listed here: https://github.com/ariya/phantomjs/commit/cab2635e66d74b7e665c44400b8b20a8f225153a

				code += "\n";
				code += "casper.then(\n";
				code += "    function()\n";
				code += "    {\n";
				code += "        Logger.LogMessage( '" + log_head_major + "Sending key [" + key_code + "] to selector [" + selector.toString() + "].' );\n";
				code += "        casper.sendKeys( '" + selector.toString() + "', casper.page.event.key['" + key_code + "'], { keepFocus: true" + modifiers.toString() + " } );\n";
				code += "    });\n";

			}

			//=====================================================================
			//	Click Command
			else if (command == 'click') {

				if (params.length != 1) {
					throw Dreamscrape.ScriptError_InvalidParameters(line_index + 1, command.toString());
				}
				var selector = npm_string(params[0]).trim();

				code += "\n";
				code += "casper.thenClick(\n";
				code += "    '" + selector.toString() + "'";
				code += "    function()\n";
				code += "    {\n";
				code += "        Logger.LogMessage( '" + log_head_major + "Clicked [" + selector.toString() + "].' );\n";
				code += "    });\n";

			}

			//=====================================================================
			//	ScrapeHtml Command
			else if (command == 'scrapehtml') {
				
				var selector = '';
				var variable = '';

				if (params.length == 1) {
					variable = npm_string(params[0]).trim();
				}
				else if (params.length == 2) {
					selector = npm_string(params[0]).trim();
					variable = npm_string(params[1]).trim();
				}
				else {
					throw Dreamscrape.ScriptError_InvalidParameters(line_index + 1, command.toString());
				}

				code += "\n";
				code += "casper.then(\n";
				code += "    function()\n";
				code += "    {\n";
				code += "        Logger.LogMessage( '" + log_head_major + "Scraping html from [" + selector.toString() + "].' );\n";
				if (selector) {
					code += "        job_data." + variable.toString() + " = casper.getHTML( '" + selector.toString() + "', false );";
				}
				else {
					code += "        job_data." + variable.toString() + " = casper.getHTML();";
				}
				code += "    });\n";

			}

			//=====================================================================
			//	ScrapeText Command
			else if (command == 'scrapetext') {

				if (params.length != 2) {
					throw Dreamscrape.ScriptError_InvalidParameters(line_index + 1, command.toString());
				}
				var selector = npm_string(params[0]).trim();
				var variable = npm_string(params[1]).trim();

				code += "\n";
				code += "casper.then(\n";
				code += "    function()\n";
				code += "    {\n";
				code += "        Logger.LogMessage( '" + log_head_major + "Scraping text from [" + selector.toString() + "].' );\n";
				code += "        job_data." + variable.toString() + " = casper.fetchText( '" + selector.toString() + "' );";
				code += "    });\n";

			}

			//=====================================================================
			//	ScrapeArray Command
			else if (command == 'scrapevalue') {

				if (params.length != 3) {
					throw Dreamscrape.ScriptError_InvalidParameters(line_index + 1, command.toString());
				}
				var selector = npm_string(params[0]).trim();
				var attribute = npm_string(params[1]).trim();
				var variable = npm_string(params[2]).trim();

				code += "\n";
				code += "casper.then(\n";
				code += "    function()\n";
				code += "    {\n";
				code += "        Logger.LogMessage( '" + log_head_major + "Scraping value from [" + selector.toString() + " | " + attribute.toString() + "].' );\n";
				code += "        job_data." + variable.toString() + " = casper.getElementAttribute( '" + selector.toString() + "', '" + attribute.toString() + "' );";
				code += "    });\n";

			}

			//=====================================================================
			//	ScrapeArray Command
			else if (command == 'scrapearray') {

				if (params.length != 3) {
					throw Dreamscrape.ScriptError_InvalidParameters(line_index + 1, command.toString());
				}
				var selector = npm_string(params[0]).trim();
				var attribute = npm_string(params[1]).trim();
				var variable = npm_string(params[2]).trim();

				code += "\n";
				code += "casper.then(\n";
				code += "    function()\n";
				code += "    {\n";
				code += "        Logger.LogMessage( '" + log_head_major + "Scraping array from [" + selector.toString() + " | " + attribute.toString() + "].' );\n";
				code += "        job_data." + variable.toString() + " = casper.getElementsAttribute( '" + selector.toString() + "', '" + attribute.toString() + "' );";
				code += "    });\n";

			}

			//=====================================================================
			//	ScrapeTable Command
			else if (command == 'scrapetable') {

				if (params.length != 2) {
					throw Dreamscrape.ScriptError_InvalidParameters(line_index + 1, command.toString());
				}
				var selector = npm_string(params[0]).trim();
				var variable = npm_string(params[1]).trim();

				code += "\n";
				code += "casper.then(\n";
				code += "    function()\n";
				code += "    {\n";
				code += "        Logger.LogMessage( '" + log_head_major + "Scraping table from [" + selector.toString() + "].' );\n";
				code += "        job_data." + variable.toString() + " = casper.GetTable( '" + selector.toString() + "' );";
				code += "    });\n";

			}

			//=====================================================================
			//	Snapshot Command
			else if (command == 'snapshot') {

				if (params.length != 1) {
					throw Dreamscrape.ScriptError_InvalidParameters(line_index + 1, command.toString());
				}
				var snapshotname = npm_string(params[0]).trim();

				code += "\n";
				code += "casper.then(\n";
				code += "    function()\n";
				code += "    {\n";
				code += "        Logger.LogMessage( '" + log_head_major + "Saving snapshot [" + snapshotname.toString() + "].' );\n";
				code += "        casper.GetPageSnapshot( '" + snapshotname.toString() + "', true, true );\n";
				code += "    });\n";

			}

			//=====================================================================
			//	Unknown Command
			else {
				throw Dreamscrape.ScriptError_SyntaxError(line_index + 1, "Unknown command [" + command + "].");
			}

		}

		code += "\n";
		return code;
	};


//---------------------------------------------------------------------
Dreamscrape.RunSteps =
	function RunSteps(StepLines, JobFolder, OnStartCallback, OnErrorCallback, OnFinishCallback) {

		// Create a new job.
		var job = {};
		job.job_id = Date.now();
		job.time_started = job.job_id;
		job.job_steps = StepLines;

		// Generate the script.
		job.job_script = Dreamscrape.CompileSteps(job.job_steps);

		// // Initialize the job folder.
		// if (npm_fs.existsSync(JobFolder))
		// {
		// 	// npm_fs.unlinkSync(JobFolder);
		// 	npm_fs.rmdirSync(JobFolder);
		// }
		// npm_fs.mkdirSync(JobFolder);

		// Make an initial save of the job.
		var project_job_filename = npm_path.join(JobFolder, '_job.json');
		npm_fs.writeFileSync(project_job_filename, JSON.stringify(job, null, 4));

		// Notify that we are starting.
		OnStartCallback(job);

		// Load the script template and inject the project script.
		var script_template_path = npm_path.join(Dreamscrape.engines_folder, 'casperjs/script_template.js');
		var template = npm_fs.readFileSync(script_template_path);
		var script = npm_string(template);
		script = '' + script.replace('// {{script_me}}', job.job_script);
		var script_filename = npm_path.join(JobFolder, '_job_script.js');
		npm_fs.writeFileSync(script_filename, script);

		// Make sure the client dependencies exist.
		var client_inject_path = npm_path.join(Dreamscrape.engines_folder, 'casperjs/_client_inject_1.js');
		var file_content = npm_fs.readFileSync(client_inject_path);
		var client_script_filename = npm_path.join(JobFolder, '_client_inject_1.js');
		npm_fs.writeFileSync(client_script_filename, file_content);

		// Execute.
		var command = 'casperjs ' + script_filename;
		var options = {};
		options.cwd = JobFolder;
		npm_exec(command, options,
			function(error, stdout, stderr) {
				// Mark the completion time.
				job.time_finished = Date.now();
				job.seconds_elapsed = (job.time_finished - job.time_started) / 1000;

				// Collect the output
				job.stdout = stdout;
				job.stderr = stderr;

				// List the artifacts.
				job.artifacts = [];
				npm_fs.readdirSync(JobFolder).forEach(
					function(entry_name) {
						if ((entry_name != '_job_script.js') &&
							(entry_name != '_job.json') &&
							(entry_name != '_client_inject_1.js')) {
							job.artifacts.push(entry_name);
						}
					});

				// Save the job.
				npm_fs.writeFileSync(project_job_filename, JSON.stringify(job, null, 4));

				// Call the callback function.
				OnFinishCallback(job);
			});

		return;
	};




//=====================================================================
// Integrate with the browser environment.
if (typeof window != 'undefined') {
	window['Dreamscrape'] = Dreamscrape;
}


//=====================================================================
// Integrate with the nodejs environment.
if (typeof exports != 'undefined') {
	exports.Dreamscrape = Dreamscrape;
}
