const should = require('chai').should();
const fs = require('fs-extra');
const { spawn } = require('child_process');

const outDir = 'test/out';

describe('as script', () => {
	before(() => {
		fs.mkdirp(outDir);
	});
	describe('input and output via arguments', () => {
		it('should work on html-import', async () => {
			const input = 'test/in/web-component.html';
			const output = outDir + '/web-component.html';
			const templ = 'test/templ/web-component.html';
			const script = 'test/in/script.js';

			await execute({input, output, script});

			const outputContent = await fs.readFile(output, 'utf-8');
			const templContent = await fs.readFile(templ, 'utf-8');
			outputContent.should.equal(templContent);
		});
		it('should work on normal html-file', async () => {
			const input = 'test/in/page.html';
			const output = outDir + '/page.html';
			const templ = 'test/templ/page.html';
			const script = 'test/in/script.js';

			await execute({input, output, script});

			const outputContent = await fs.readFile(output, 'utf-8');
			const templContent = await fs.readFile(templ, 'utf-8');
			outputContent.should.equal(templContent);
		});
	});
	describe('input and output via pipes', () => {
		it('should work on html-import', async () => {
			const input = 'test/in/web-component.html';
			const templ = 'test/templ/web-component.html';
			const script = 'test/in/script.js';

			const inputContent = await fs.readFile(input, 'utf-8');
			const outputContent = await execute({inputContent, script});

			const templContent = await fs.readFile(templ, 'utf-8');
			outputContent.should.equal(templContent);
		});
		it('should work on normal html-file', async () => {
			const input = 'test/in/page.html';
			const templ = 'test/templ/page.html';
			const script = 'test/in/script.js';

			const inputContent = await fs.readFile(input, 'utf-8');
			const outputContent = await execute({inputContent, script});

			const templContent = await fs.readFile(templ, 'utf-8');
			outputContent.should.equal(templContent);
		});
	});
});

async function execute(opt) {
	const args = [];
	if (opt.script) {
		args.push('-s');
		args.push(opt.script);
	}
	if (opt.input) {
		args.push('-i');
		args.push(opt.input);
	}
	if (opt.output) {
		args.push('-o');
		args.push(opt.output);
	}

	let output = "";
	const proc = spawn('bin/replace-html-script', args);
	proc.stdout.setEncoding('utf-8');
	proc.stdout.on('data', data => {
		output += data;
	});
	if (opt.inputContent) {
		proc.stdin.write(opt.inputContent);
		proc.stdin.end();
	}
	return new Promise((resolve, reject) => {
		proc.on('error', reject);
		proc.on('close', () => {
			resolve(output);
		});
	});
}
