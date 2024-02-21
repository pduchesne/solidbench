import * as cheerio from 'cheerio';
import {fetchFoodFacts} from "../off";
import {Receipt} from "../model";
import {ColruytEanMap} from "../colruytdb/storage";

/**
 * Find the EAN code for a Colruyt product
 * @param colruytId
 */
export async function getProductEAN(colruytId: string) {
    const url = "https://fic.colruytgroup.com/productinfo/fr/cogo/" + colruytId;
    const htmlStr = await fetch(url).then(resp => resp.text()).catch(err => {
        console.log(`Failed to fetch ${url} : ${err}`);
        if (err.code == 'UND_ERR_SOCKET') {
            // TODO retry ?
        }
        return undefined;
    });

    if (!htmlStr) return undefined;

    const $ = cheerio.load(htmlStr);
    const EAN = $('#current_gtin').text();

    return EAN;
}

/**
 * Browse a list of Colruyt receipts and gather product items, their respective EANs and related OpenFoodFacts data
 * @param receipts
 * @param progressMonitor
 */
export async function enrichReceipts(receipts: Receipt[], eanMap: ColruytEanMap, progressMonitor?: (event: {
    colruyt_items: Record<string, any>,
    off_items: Record<string, any>
}) => void) {

    const colruyt_items: Record<string, any> = {};
    const off_items: Record<string, any> = {};
    const eanMapUpdate: ColruytEanMap = {};

    for (const receipt of receipts) {
        for (const item of receipt.items) {
            if (!(item.articleId in colruyt_items)) {
                if (!(item.articleId in eanMap))
                    eanMapUpdate[item.articleId] = { ean: await getProductEAN(item.articleId), label: item.label};
                else if (!eanMap[item.articleId].label) {
                    eanMapUpdate[item.articleId] = { ...eanMap[item.articleId], label: item.label};
                }
                const ean = eanMap[item.articleId]?.ean || eanMapUpdate[item.articleId]?.ean;

                colruyt_items[item.articleId] = {...item, ean};
                if (ean && !(ean in off_items)) {
                    const itemFacts = (await fetchFoodFacts(ean))?.product || null;
                    off_items[ean] = itemFacts;
                }

                progressMonitor && progressMonitor({
                    colruyt_items,
                    off_items
                });
            }
        }
    }

    return {
        colruyt_items,
        off_items,
        eanMapUpdate
    }
}