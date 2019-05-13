const should = require('chai').should();
const fs = require('fs-extra');
const { replaceScript } = require('../index.js');

describe('as module', () => {
	it('should work on html-import', async () => {
		const input = 'test/in/web-component.html';
		const output = 'test/out/web-component.html';
		const templ = 'test/templ/web-component.html';
		const script = 'test/in/script.js';

		await replaceScript({input, output, script});

		const outputContent = await fs.readFile(output, 'utf-8');
		const templContent = await fs.readFile(templ, 'utf-8');
		outputContent.should.equal(templContent);
	});
	it('should work on normal html-file', async () => {
		const input = 'test/in/page.html';
		const output = 'test/out/page.html';
		const templ = 'test/templ/page.html';
		const script = 'test/in/script.js';

		await replaceScript({input, output, script});

		const outputContent = await fs.readFile(output, 'utf-8');
		const templContent = await fs.readFile(templ, 'utf-8');
		outputContent.should.equal(templContent);
	});
});
