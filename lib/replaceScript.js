const htmlparser = require("htmlparser2");
const fs = require('fs-extra');

const debugLog = true;

/**
* @param opt.input  {String|ReadStream}
* @param opt.output {String|WriteStream}
* @param opt.script {String|WriteStream}
*/
async function replaceScript(opt) {
	{
		let opt_ = await processOpt(opt);
		opt = opt_;
	}
	opt.log("start");

	opt.input.on('error', e => {
		console.error("input err:", e);
	});

	opt.output.on('error', e => {
		console.error("output err:", e);
	});

	opt.scriptContent = await readFile(opt.script);
	const parser = new Parser(opt);

	opt.input.pipe(parser._parser);
}

async function readFile(readStream) {
	return new Promise((resolve, reject) => {
		let content = "";
		readStream.on('data', data => {
			content += data;
		});
		readStream.on('end', () => {
			resolve(content);
		});
		readStream.on('error', e => {
			reject(e);
		});
	});
}

class Parser {
	constructor(opt) {
		this._opt = opt;
		this._script = 0;
		this._finalize = false;

		this._parser = new htmlparser.Parser(
			{
				onopentag: this.onOpenTag.bind(this),
				onclosetag:  this.onCloseTag.bind(this),
				ontext:  this.onText.bind(this),
			},
			{
				decodeEntities: true,
				recognizeSelfClosing: true,
				lowerCaseTags: false,
				lowerCaseAttributeNames: false,
			}
		);
	}

	onOpenTag(name, attribs) {
		if (!this._finalize && isScriptTag(name) && isInlineJS(attribs)) {
			this._script ++;
			this._opt.log("<script>", this._script, attribs);

			if (this._script === 1) {
				this._opt.output.write(toOpenTag(name, attribs));
			}
			this._opt.output.write('\n');
			this._opt.output.write(this._opt.scriptContent);
			this._opt.output.write('\n');
		}
		else {
			this._opt.output.write(toOpenTag(name, attribs));
		}
	}

	onCloseTag(tagname) {
		if (!this._finalize && this._script > 0) {
			if (isScriptTag(tagname)) {
				this._opt.log(`</${tagname}`, this._script);
				this._script--;
				if (this._script === 0) {
					this._finalize = true;
					this._opt.output.write(toCloseTag(tagname));
				}
			}
		}
		else {
			this._opt.output.write(`</${tagname}>`);
		}
	}

	onText(text) {
		if (this._finalize || this._script <= 0) {
			this._opt.output.write(text);
		}
	}
}

function isScriptTag(tagname) {
	return tagname === 'script' || tagname === 'SCRIPT';
}

function isInlineJS(attribs) {
	if (!attribs) return true;
	if (attribs.src || attribs.SRC) return false;
	if (attribs.type && attribs.type !== 'text/javascript') return false;
	if (attribs.TYPE && attribs.TYPE !== 'text/javascript') return false;
	return true;
}

function toOpenTag(tagname, attribs) {
	let s = `<${tagname}`;
	for (let attr in attribs) {
		if (Reflect.getOwnPropertyDescriptor(attribs, attr)) {
			s += ' ' + attr + '="' + attribs[attr] + '"';
		}
	}
	return s + '>';
}

function toCloseTag(tagname) {
	return `</${tagname}>`;
}

async function processOpt(opt) {
	{
		const { input, output, script } = opt;
		opt = { input, output, script };
	}
	if (!opt || typeof opt !== 'object') throw new Error("parameter must be object");

	await processInputOption(opt);
	await processOutputOption(opt);
	await processScriptOption(opt);

	opt.log = function(...args) {
		if (!debugLog) return;
		const out = opt.output === process.stdout
			? 'log'
			: 'error';

		console[out](`[replaceScript]`, ...args);
	};
	return opt;
}


async function processInputOption(opt) {
	if (!opt.input || (typeof opt.input !== 'string' && typeof opt.input !== 'object') ) {
		throw new Error("parameter 'input' must be filename (string) or readable stream");
	}
	if (typeof opt.input === 'string') {
		opt.originalInput = opt.input;
		if (!await fs.pathExists(opt.originalInput)) {
			throw new Error(`input file does not exist: ${opt.originalInput}`);
		}
		opt.input = fs.createReadStream(opt.originalInput);
	}
}

async function processOutputOption(opt) {
	if (!opt.output || (typeof opt.output !== 'string' && typeof opt.output !== 'object') ) {
		throw new Error("parameter 'out' must be filename (string) or writable stream");
	}

	if (typeof opt.output === 'string') {
		opt.originalOutput = opt.output;
		if (opt.originalInput && opt.originalInput === opt.originalOutput) {
			throw new Error("input must not be output");
		}
		try {
			if (await fs.pathExists(opt.originalOutput)) {
				await fs.unlink(opt.originalOutput);
			}
		}
		catch(e){
			console.info("ignoring exception: "+e);
		}
		opt.output = fs.createWriteStream(opt.originalOutput);
	}
}

async function processScriptOption(opt) {
	if (!opt.script || (typeof opt.script !== 'string' && typeof opt.script !== 'object') ) {
		throw new Error("parameter 'script' must be filename (string) or readable stream");
	}
	if (typeof opt.script === 'string') {
		opt.originalScript = opt.script;
		if (!await fs.pathExists(opt.originalScript)) {
			throw new Error(`script file does not exist: ${opt.originalScript}`);
		}
		opt.script = fs.createReadStream(opt.originalScript);
	}
}

module.exports = { replaceScript };
