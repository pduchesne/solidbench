import * as fs from "node:fs";
import {parsePdfData} from "./parser";
import {getLogger} from "log4js";

jest.setTimeout(3000000);

const log = getLogger('test');
log.level = "debug";

test('Parse PDF', async () => {

    const pdfData = fs.readFileSync('./static/colruyt.pdf');

    const {receipts} = await parsePdfData(new Uint8Array(pdfData).buffer);

    receipts;

});

