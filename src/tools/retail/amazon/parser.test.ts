//import test from 'node:test';
import * as fs from "node:fs";

import {getLogger} from "log4js";

import {BlobReader, ZipReader} from "@zip.js/zip.js";
import { parse } from 'csv-parse';
import {Duplex} from "node:stream";
import {parseZipExport} from "./parser";

jest.setTimeout(3000000);

const log = getLogger('test');
log.level = "debug";

test('Parse ZIP', async () => {


    const zipData = fs.readFileSync('/home/pduchesne/Downloads/Your Orders.zip');
    const zipDataBlob = new Blob([zipData]);
    const zipFileReader = new BlobReader(zipDataBlob);


    const zipReader = new ZipReader(zipFileReader);
    const orderHistoryEntries = (await zipReader.getEntries()).filter(e => e.filename.startsWith('Retail.OrderHistory') && e.filename.endsWith('.csv'));

    const csvEntry = orderHistoryEntries[0];
    //const blobWriter = new BlobWriter();
    if (csvEntry.getData) {
        const parser = parse({delimiter: ',', relaxQuotes: true});
        parser.on('readable', function(){
            let record;
            while ((record = parser.read()) !== null) {
                record;
            }
        });


        //const data = await csvEntry.getData(helloWorldWriter);


        const webParser = Duplex.toWeb(parser);
        await csvEntry.getData(webParser);
        parser.end();
    }


});

test('Parser method', async () => {


    const zipData = fs.readFileSync('/home/pduchesne/Downloads/Your Orders.zip');
    const zipDataBlob = new Blob([zipData]);

    const receipts = await parseZipExport(zipDataBlob);

    receipts;
});
