//import test from 'node:test';
import {ColruytProductDb} from "./services";
import {getLogger} from "log4js";
import {existsSync, readdirSync, readFileSync, writeFileSync,} from "node:fs";
import {fetchFoodFacts, OffMetadata} from "../../off";
import {_404undefined} from "@hilats/utils";

jest.setTimeout(3000000);

const log = getLogger('test');
log.level = "debug";


//const trace_events = require('node:trace_events');
//const tracing = trace_events.createTracing({ categories: ['node.http'] });
//tracing.enable();

test('Fetch Colruyt MD', async () => {


    // Bioplanet : https://apip.bioplanet.be/gateway/ictmgmt.emarkecom.cgproductretrsvc.v2/v2/v2/fr/products/626163?ts=1709809695910&placeId=1811&clientCode=BIOBE
    // X-CG-APIKey : 6f88ea62-82ee-4372-9b60-13bbd0a61cf7


    const colruytDb = new ColruytProductDb(
        'https://apip.colruyt.be/gateway/ictmgmt.emarkecom.cgproductretrsvc.v2/v2/v2', 'CLP', '604',
        'a8ylmv13-b285-4788-9e14-0f79b7ed2411',
        ["TS01461a64=016303f955c45fb4796d150cf946850f31cac6124a6579dcf549f781e6a4c56f2251cf1b1a328325955a4f66b0bc85e9d9eb6d9396",
            "TS019261f5=016303f955851e3f297dd322e9ac7b853617c2774735a9b8ef34178e8b549df2b1e3420e46f10d9f22c1b2472431325bcf715f86b2",
        "dtCookie=v_4_srv_20_sn_97AEC3CB2E605C891EB2E0AF267BAECA_perc_100000_ol_0_mul_1_app-3Ab84fed97a8123cd5_0"]
        );

    /*
    const colruytDb = new ColruytProductDb(
        'https://ecgproductmw.colruyt.be/ecgproductmw/v1', 'CLP', '604', 'a8ylmv13-b285-4788-9e14-0f79b7ed2411');

     */
    const results = await colruytDb.fetchAllProducts(-1, 245, 40);

    writeFileSync("products-test4.json", JSON.stringify(results, null, 4));
});


test('Fetch Bioplanet MD', async () => {


    // Bioplanet : https://apip.bioplanet.be/gateway/ictmgmt.emarkecom.cgproductretrsvc.v2/v2/v2/fr/products/626163?ts=1709809695910&placeId=1811&clientCode=BIOBE
    // X-CG-APIKey : 6f88ea62-82ee-4372-9b60-13bbd0a61cf7

    //const colruytDb = new ColruytProductDb(
    //    'https://ecgproductmw.colruyt.be/ecgproductmw/v1', 'BIOBE', '1811');
    const colruytDb = new ColruytProductDb(
        'https://apip.bioplanet.be/gateway/ictmgmt.emarkecom.cgproductretrsvc.v2/v2/v2', 'BIOBE', '1811', 'a8ylmv13-b285-4788-9e14-0f79b7ed2411');
    const results = await colruytDb.fetchAllProducts(-1, 200, 0);

    writeFileSync("products-bioplanet.json", JSON.stringify(results, null, 4));
});


/**
 * Create or augment ./colruyt_off_map.json by fetching OFF metadata for items in ./products-bioplanet.json or
 */
test('Process Colruyt MD', async () => {

    const existingProducts:Record<string, any> = existsSync("colruyt_off_map.json") ? JSON.parse(readFileSync("colruyt_off_map.json", { encoding: "utf-8" })) : {};

    const items = JSON.parse(readFileSync("products-bioplanet.json", { encoding: "utf-8" }));

    for (let idx in items) {
        const i = items[idx];
        const {productId, commercialArticleNumber, technicalArticleNumber, name, LongName, gtin} = i;

        let offs : any[] | undefined = existingProducts[i.commercialArticleNumber]?.offs;
        if (!offs) {
            offs = [];
            for (let gtinid of (gtin || [])) {
                const off = await fetchFoodFacts(gtinid).catch(_404undefined);
                off && offs.push(off);
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
        } else {
            log.info(`Product already exists : ${i.commercialArticleNumber}`);
        }

        //console.log(`Processing ${idx} of ${items.length} - best off ${offs.length && offs[0].completeness}`);
    }

    log.info(`Total items : ${Object.keys(existingProducts).length}`);

    writeFileSync("colruyt_off_map.json", JSON.stringify(existingProducts, null, 4));
});


/**
 * Generate ./colruyt_id_ean_map.json from ./colruyt_off_map.json
 */
test('Process Colruyt and OFF MD', async () => {


    const items = JSON.parse(readFileSync("colruyt_off_map.json", { encoding: "utf-8" }));

    const offMap:Record<string, string> = {};
    const offRecords:Record<string, OffMetadata> = {};
    const idMap:Record<string, {eans: [string], off: string | null}> = {};

    let count = 0;
    for (let id in items) {
        const i = items[id];
        const { /* productId, commercialArticleNumber, technicalArticleNumber, name, LongName,*/ gtin,   offs} = i;

        let offRecord: OffMetadata | undefined;

        if (offs.length) {
            offRecord = {} as any;

            offs.forEach((off:OffMetadata) => {
                for (const key of ['code', 'food_groups', 'ecoscore_grade', 'image_url', 'nutrient_levels', 'nutriscore_grade', 'product_name'] as (keyof OffMetadata)[]) {
                    if (offRecord && !offRecord[key] && off[key] && off[key] != 'unknown') offRecord[key] = off[key] as any;
                }
            })


            if (offRecord) {
                if (!offMap[offRecord.code]) {
                    offMap[offRecord.code] = id;
                    offRecords[offRecord.code] = offRecord;
                }
                else
                    console.warn(`OFF ${offRecord.code} for ${id} already declared (${offMap[offRecord.code]})`)
            }
        }

        if (id in idMap) console.warn(`ID already set : ${id}`);
        else idMap[id] = {eans: gtin, off: offRecord?.code || null} ;
        count++;
    }

    console.log(`Processed items : ${count}`);
    console.log(`Found OFF : ${Object.keys(offRecords).length}`);

    writeFileSync("colruyt_id_ean_map.json", JSON.stringify(idMap, null, 4));
    writeFileSync("off_records.json", JSON.stringify(offRecords, null, 4));
});


// Aggregate Colruyt MD from ./temp into ./colruyt_off_map.json .
// Appends to ./colruyt_off_map.json if it exists
test('Aggregate temp files', async () => {

    // look for existing colruyt_off_map.json
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