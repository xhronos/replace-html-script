const should = require('chai').should();
const fs = require('fs-extra');
const { replaceScript } = require('../index.js');

const outDir = 'test/out';

describe('as module', () => {
	before(() => {
		fs.mkdirp(outDir);
	});
	it('should work on html-import', async () => {
		const input = 'test/in/web-component.html';
		const output = outDir + '/web-component.html';
		const templ = 'test/templ/web-component.html';
		const script = 'test/in/script.js';

		await replaceScript({input, output, script});

		const outputContent = await fs.readFile(output, 'utf-8');
		const templContent = await fs.readFile(templ, 'utf-8');
		outputContent.should.equal(templContent);
	});
	it('should work on normal html-file', async () => {
		const input = 'test/in/page.html';
		const output = outDir + '/page.html';
		const templ = 'test/templ/page.html';
		const script = 'test/in/script.js';

		await replaceScript({input, output, script});

		const outputContent = await fs.readFile(output, 'utf-8');
		const templContent = await fs.readFile(templ, 'utf-8');
		outputContent.should.equal(templContent);
	});
});
