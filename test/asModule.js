const should = require('chai').should();
const { replaceScript } = require('../index.js');

const input = 'test/in/web-component.html';
const output = 'test/out/web-component.html';
const script = 'test/in/script.js';

describe('as module', () => {
	it('should work on html-import', async () => {
		await replaceScript({input, output, script});
	});
});
