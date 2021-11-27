const utils = require('../utils')

describe('utils/removeExtensionFromFile', () => {
    const tests = [
        {
            description: "should return file name",
            input: "file.js",
            expected: "file"
        },
        {
            description: "should return file name without extension",
            input: "file",
            expected: "file"
        },
        {
            description: "should return file name with two extensions",
            input: "compress.tar.gz",
            expected: "compress"
        }
    ];
    tests.forEach(test => {
        it(test.description, () => {
            const actual = utils.removeExtensionFromFile(test.input);
            expect(actual).toBe(test.expected);
        });
    });
});