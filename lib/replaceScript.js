const RewritingStream = require('parse5-html-rewriting-stream');
//const stringstream = require('stringstream')
const fs = require('fs-extra');

const debugLog = false;

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
	opt.scriptContent = await readFile(opt.script);

	return new Promise((resolve, reject) => {
		opt.log("start");

		opt.input.on('error', e => {
			console.error("input err:", e);
			reject(e);
		});

		opt.output.on('error', e => {
			console.error("output err:", e);
			reject(e);
		});

		opt.output.on('close', resolve);

		const htmlRewriter = new HtmlRewriter(opt);

		opt.input
		.pipe(htmlRewriter.rewriter)
		.pipe(opt.output);
	});
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

class HtmlRewriter {
	constructor(opt) {
		this._opt = opt;
		this._script = 0;
		this._finalize = false;

		this.rewriter = new RewritingStream();

		this.rewriter.on('startTag', this.onOpenTag.bind(this));
		this.rewriter.on('endTag', this.onCloseTag.bind(this));
		this.rewriter.on('text', this.onText.bind(this));
	}

	onOpenTag(startTag) {
		if (!this._finalize && isScriptTag(startTag.tagName) && isInlineJS(startTag.attrs)) {
			this._script ++;
			this._opt.log("<script>", this._script, startTag.attrs);
			if (this._script === 1) {
				this.rewriter.emitStartTag(startTag);
				this.rewriter.emitRaw('\n');
				this.rewriter.emitRaw(this._opt.scriptContent);
				this.rewriter.emitRaw('\n');
			}
		}
		else {
			this.rewriter.emitStartTag(startTag);
		}
	}

	onCloseTag(endTag) {
		if (!this._finalize && this._script > 0) {
			if (isScriptTag(endTag.tagName)) {
				this._opt.log(`</${endTag.tagName}`, this._script);
				this._script--;
				if (this._script === 0) {
					this.rewriter.emitEndTag(endTag);
				}
			}
		}
		else {
			this.rewriter.emitEndTag(endTag);
		}
	}

	onText(text, raw) {
		if (this._finalize || this._script <= 0) {
			this.rewriter.emitRaw(raw);
		}
	}
}

function isScriptTag(tagname) {
	return tagname === 'script' || tagname === 'SCRIPT';
}

function isInlineJS(attrs) {
	if (!attrs) return true;
	let type = null;
	for (let i=0; i<attrs.length; ++i) {
		const attr = attrs[i];
		if (attr.name === 'src') return false;
		if (attr.name === 'type') {
			type = attr;
		}
	}
	if (!type) return true;
	if (type && type.value && type.value !== 'text/javascript') return false;
	return true;
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
	opt.input.setEncoding('utf8');
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
	opt.script.setEncoding('utf8');
}

module.exports = { replaceScript };
