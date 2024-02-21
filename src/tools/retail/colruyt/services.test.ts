//import test from 'node:test';
import {enrichReceipts, getProductEAN} from "./services";
import * as fs from "node:fs";
import {parsePdfData} from "./parser";
import {ColruytDbStorage} from "../colruytdb/storage";
import {getLogger} from "log4js";

jest.setTimeout(3000000);

const log = getLogger('test');
log.level = "debug";

const TEST_FOLDER = 'https://pduchesne.solidcommunity.net/test/';

test('Fetch Colruyt EIN', async () => {
    const ein = await getProductEAN('26719');

    console.log(ein);
});

test('Read/write EAN DB', async () => {
    const colruytDb = new ColruytDbStorage(TEST_FOLDER);
    const einMap = await colruytDb.einMap;

    await colruytDb.putMap({...einMap});
});

test('Parse PDF', async () => {
    const colruytDb = new ColruytDbStorage(TEST_FOLDER);
    const einMap = await colruytDb.einMap;
    log.log(`EIN Map: ${Object.keys(einMap).length}`);

    const pdfData = fs.readFileSync('./static/colruyt.pdf');

    const {receipts} = await parsePdfData(new Uint8Array(pdfData).buffer);

    log.log(`Processing ${receipts.length} receipts`);
    const {colruyt_items, off_items, eanMapUpdate} = await enrichReceipts(receipts.slice(0, 70), einMap, event => {
        log.log(`Progress: ${Object.keys(event.colruyt_items).length}, ${Object.keys(event.off_items).length}`);
    });

    const updatedMap = {...einMap, ...eanMapUpdate};
    log.log(`EIN Updated Map: ${Object.keys(updatedMap).length}`);
    const resp = await colruytDb.putMap(updatedMap);
    const respText = await resp.text();
    log.log(`PUT response:  ${resp.status} - ${respText}`);

    colruyt_items;
    off_items;
});


/*
// see how to login to NSS, CSS : https://forum.solidproject.org/t/login-in-a-local-solid-sever-using-the-solid-node-client/5846
test('Login to NSS', async () => {

    const client = new SolidNodeClient();
    const result = await client.login({
        idp : "https://solidcommunity.net", // e.g. https://solidcommunity.net
        username : "pduchesne",
        password : "nN!DX6aLwSWGvEd",
    }).then((session) => {
        console.log(session.session.info.webId)
    });

    result
});

 */