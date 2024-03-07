//import test from 'node:test';
import {ColruytProductDb, enrichReceipts, getProductEAN} from "./services";
import * as fs from "node:fs";
import {parsePdfData} from "./parser";
import {ColruytDbStorage} from "../colruytdb/storage";
import {getLogger} from "log4js";
import {existsSync, readdirSync, readFileSync, writeFileSync,} from "node:fs";
import {fetchFoodFacts} from "../off";
import {_404undefined} from "@hilats/utils";

jest.setTimeout(3000000);

const log = getLogger('test');
log.level = "debug";

const TEST_FOLDER = 'https://storage.inrupt.com/42036c04-d45a-4ff2-8545-c7d718029299/test/'; //'https://pduchesne.solidcommunity.net/test/';

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
    const {colruyt_items, off_items, eanMapUpdate} = await enrichReceipts(receipts, einMap, event => {
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


//const trace_events = require('node:trace_events');
//const tracing = trace_events.createTracing({ categories: ['node.http'] });
//tracing.enable();

test('Fetch Colruyt MD', async () => {

    /*
    const colruytDb = new ColruytProductDb(
        'https://apip.colruyt.be/gateway/ictmgmt.emarkecom.cgproductretrsvc.v2/v2/v2',
        'a8ylmv13-b285-4788-9e14-0f79b7ed2411',
        ["TS01461a64=016303f95553dcdf8c69475c9ee235aeaf292e7b5be7a69dfd06b30dd40076c6ce001b66ea86af0cb86a51961155e51d4ecb6af3b0",
            "TS019261f5=016303f9553359b5d5b2acc795c5dd8e67b6cd80689a110490abf3cdb3bba7179d0e70af9fa9dddc2e26cb7328d0603dd44a43c3c0",
        "dtCookie=v_4_srv_19_sn_75900D988FBF2D97D1D778847AD046AE_perc_100000_ol_0_mul_1_app-3Ab84fed97a8123cd5_0"]);
*/
    const colruytDb = new ColruytProductDb(
        'https://ecgproductmw.colruyt.be/ecgproductmw/v1');
    const results = await colruytDb.fetchAllProducts(-1, 245, 0);

    writeFileSync("products-test.json", JSON.stringify(results, null, 4));
});

test('Process Colruyt MD', async () => {

    const existingProducts:Record<string, any> = existsSync("colruyt_off_map.json") ? JSON.parse(readFileSync("colruyt_off_map.json", { encoding: "utf-8" })) : {};

    const items = JSON.parse(readFileSync("products-test.json", { encoding: "utf-8" }));

    for (let idx in items) {
        const i = items[idx];
        const {productId, commercialArticleNumber, technicalArticleNumber, name, LongName, gtin} = i;

        let offs : any[] | undefined = existingProducts[i.commercialArticleNumber]?.offs;
        if (!offs) {
            offs = [];
            for (let ean of (gtin || [])) {
                const off = await fetchFoodFacts(ean).catch(_404undefined);
                off && offs.push(off.product);
            }
            offs = offs.sort((o1, o2) => ((o1.completeness || 0) > (o2.completeness || 0)) ? -1 : 1);
            if (offs.length) {
                log.info(`Found best off ${offs.length && offs[0].completeness}`);
            } else {
                log.info(`OFF not found for ${i.commercialArticleNumber}`);
            }

        }

        if (! existingProducts[i.commercialArticleNumber]) {
            existingProducts[i.commercialArticleNumber] = {productId, commercialArticleNumber, technicalArticleNumber, name, LongName, gtin, offs};
            log.info(`Product added : ${i.commercialArticleNumber}`);
        }

        //console.log(`Processing ${idx} of ${items.length} - best off ${offs.length && offs[0].completeness}`);
    }

    log.info(`Total items : ${Object.keys(existingProducts).length}`);

    writeFileSync("colruyt_off_map.json", JSON.stringify(existingProducts, null, 4));
});

test('Process Colruyt and OFF MD', async () => {


    const items = JSON.parse(readFileSync("colruyt_off_map.json", { encoding: "utf-8" }));

    const offMap:Record<string, string> = {};
    const idMap:Record<string, any> = {};

    let count = 0;
    for (let id in items) {
        const i = items[id];
        const { /* productId, commercialArticleNumber, technicalArticleNumber, name, LongName, gtin*/   offs} = i;

        offs.forEach((off:any) => {
            if (!offMap[off.code])
                offMap[off.code] = id;
            else
                console.warn(`OFF ${off.code} for ${id} already declared (${offMap[off.code]})`)
        })

        if (id in idMap) console.warn(`ID already set : ${id}`);
        else idMap[id] = offs[0]?.code || null;
        count++;
    }

    console.log(`Processed items : ${count}`);

    writeFileSync("colruyt_off_id_map.json", JSON.stringify(idMap, null, 4));
});



test('Aggregate temp files', async () => {

    const existingProducts:Record<string, any> = existsSync("colruyt_off_map.json") ? JSON.parse(readFileSync("colruyt_off_map.json", { encoding: "utf-8" })) : {};

    const files = readdirSync('./temp', {withFileTypes: true});
    for (let f of files) {
        if (f.name.endsWith('.json')) {
            const jsonStr = readFileSync(f.path+'/'+f.name).toString();
            const json = JSON.parse(jsonStr);
            const products = json.products;

            for (let idx in products) {
                const i = products[idx];
                const {productId, commercialArticleNumber, technicalArticleNumber, name, LongName, gtin} = i;


                let offs: any[] = [];
                /*
                for (let ean of (gtin || [])) {
                    const off = await fetchFoodFacts(ean).catch(_404undefined);
                    off && offs.push(off.product);
                }
                offs = offs.sort((o1, o2) => ((o1.completeness || 0) > (o2.completeness || 0)) ? -1 : 1 );
*/
                if (! existingProducts[i.commercialArticleNumber]) {
                    existingProducts[i.commercialArticleNumber] = {productId, commercialArticleNumber, technicalArticleNumber, name, LongName, gtin, offs};
                    log.info(`Product added : ${i.commercialArticleNumber}`);
                }


                //console.log(`Processing ${Object.keys(allProducts).length}`);
            }
        }
    }

    log.info(`Total products : ${Object.keys(existingProducts).length}`)

    writeFileSync("colruyt_off_map.json", JSON.stringify(existingProducts, null, 4));
});