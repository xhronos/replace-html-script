const htmlparser = require("htmlparser2");
const fs = require('fs-extra');

// const inputFile  = "test/web/test1.html";
// const outFile    = "out.html";
// const scriptFile = "dummy-script.js";

/**
* @param opt.input  {String|ReadStream}
* @param opt.output {String|WriteStream}
* @param opt.script {String|WriteStream}
*/
async function replaceScript(opt) {
	opt = processOpt(opt);

	try {
		fs.unlinkSync(outFile);
	}
	catch(e){
		console.log("ignoring exception: "+e);
	}

	let inScript = 0;
	let doFinalize = false;

	const parser = new htmlparser.Parser({
		onopentag: function(name, attribs){
			if(name === "script" && attribs.type === "text/javascript"){
				console.log("<script>");
				inScript ++;
			}
		},
		ontext: function(text){
			if (!inScript) console.log(text);
		},
		onclosetag: function(tagname){
			if(tagname === "script"){
				console.log("</script>");
				doFinalize
			}
		}
	}, {decodeEntities: true});

	const ws = fs.createWriteStream(outFile);
	const rs = fs.createReadStream(inputFile);

	rs.pipe(parser);//.write("Xyz <script type='text/javascript'>var foo = '<<bar>>';</ script>");
	//parser.end();



}

function processOpt(opt) {
	{
		const { input, output, script } = opt;
		opt = { input, output, script };
	}
	if (!opt || typeof opt !== 'object') throw new Error("parameter must be object");
	if (!opt.input || (typeof opt.input !== 'string' && typeof opt.input !== 'object') ) {
		throw new Error("parameter 'in' must be filename (string) or readable stream");
	}
	if (!opt.output || (typeof opt.output !== 'string' && typeof opt.output !== 'object') ) {
		throw new Error("parameter 'out' must be filename (string) or writable stream");
	}
	if (!opt.script || (typeof opt.script !== 'string' && typeof opt.script !== 'object') ) {
		throw new Error("parameter 'script' must be filename (string) or readable stream");
	}
	if (opt.input === opt.output) {
		throw new Error("input must not be output");
	}
	if (typeof opt.input === 'string') {
		opt.input = fs.createReadStream(opt.input);
	}
	if (typeof opt.output === 'string') {
		opt.output = fs.createWriteStream(opt.output);
	}
	return opt;
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//
//                              command line
//
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

function printUsage() {
	console.log(`usage: ${process.args[0]} (-i|--input) <html-file> (-s|--script) <script-file> [(-o|--output) <output-file>]`);
}

function missingParam(param) {
	console.error(`missing parameter for ${JSON.stringify(param)}`);
	printUsage();
	process.exit(1);
}

function unknownParam(param) {
	console.error(`unknown parameter ${JSON.stringify(param)}`);
	printUsage();
	process.exit(1);
}

function processCmdlineOptions() {
	const argv = process.argv;
	const opt = { in:null, js: null, out:null };

	for (let i=1 ; i<argv.length; i++) {
		if (argv[i] === "-h" || argv[i] == "--html") {
			printUsage();
			process.exit(0);
		}
		else if (argv[i] === "-i" || argv[i] == "--input") {
			if (i+1 < argv.length) {
				++i;
				opt.input = argv[i];
			}
			else missingParam(argv[i]);
		}
		else if (argv[i] === "-o" || argv[i] == "--output") {
			if (i+1 < argv.length) {
				++i;
				opt.output = argv[i];
			}
			else missingParam(argv[i]);
		}
		else if (argv[i] === "-s" || argv[i] == "--script") {
			if (i+1 < argv.length) {
				++i;
				opt.script = argv[i];
			}
			else missingParam(argv[i]);
		}
		else {
			unknownParam(argv[i]);
		}
	}
	// post processing
	if (!opt.input) {
		opt.input = process.stdin;
		opt.input.setEncoding( 'utf8' );
	}
	return opt;
}

const _main = typeof require !== 'undefined' && require.main==module;

if (_main) {
	const opt = processCmdlineOptions();
	replaceScript(opt)
	.then( () => process.exit(0) );
}

module.exports = { replaceScript };
