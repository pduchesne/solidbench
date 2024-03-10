import * as cheerio from 'cheerio';
import {fetchFoodFacts} from "../off";
import {Receipt, VendorArticle} from "../model";
import {ColruytEanMap} from "../colruytdb/storage";
import {proxify_url, throwOnHttpStatus} from "@hilats/utils";

const colruytIdMap: ColruytIdEanMap = require('./colruyt_id_ean_map.json');

/*
import { setTimeout } from "timers/promises";
import {getLogger} from "log4js";
const logger = getLogger('colruyt');
logger.level = "debug";
*/

export type ColruytIdEanMap = Record<string, { eans: [string], off: string }>;

export class ColruytProductDb {

    private API_ROOT: string;
    private CLIENT: string;
    private PLACE: string;
    private API_KEY: string | undefined;
    private cookies: string[];

    constructor(API_ROOT: string, CLIENT: string, PLACE: string, API_KEY?: string, cookies?: string[]) {
        this.API_ROOT = API_ROOT;
        this.API_KEY = API_KEY;
        this.cookies = cookies || [];
        this.CLIENT = CLIENT;
        this.PLACE = PLACE;
    }

    async fetchAllProducts(max = -1, pageSize = 100, start = 0,) {
        const results = [];

        try {
            for (let page = start; max < 0 || page * pageSize < max; page++) {

                const {productsFound, products} = await this.fetchProducts(page, pageSize);
                if (max == -1) max = productsFound;
                results.push(...products);

                //logger.info(`Found ${results.length} products, total ${productsFound}`);

                //await setTimeout(1000);
            }
        } catch (err) {
            console.warn(err);
        }

        return results;
    }

    async fetchProducts(page = 0, pageSize = 100) {

        const url = `${this.API_ROOT}/fr/products?placeId=${this.PLACE}&clientCode=${this.CLIENT}&page=${page + 1}&size=${pageSize}`;

        //console.log(`Fetching ${url}`);

        const headers: Record<string, string> = this.API_KEY ? {'X-CG-APIKey': this.API_KEY} : {};
        headers['User-Agent'] = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';
        headers['Accept'] = 'application/json';
        headers['Origin'] = 'https://www.colruyt.be';
        headers['Referer'] = 'https://www.colruyt.be/';
        headers['Accept-Encoding'] = 'hbr, deflate, gzip, x-gzip';
        headers['Cookie'] = this.cookies.join(';')
        return fetch(url, {headers}).then(resp => {
            const cookies = resp.headers.getSetCookie();
            this.cookies = cookies.map(c => c.split(';')[0]);
            return resp;
        }).then(throwOnHttpStatus).then(resp => resp.json()).catch(err => {
            console.warn(`Request failed : ${url}`);
            throw err;
        });
    }
}


/**
 * Find the EAN code for a Colruyt product
 * @param colruytId
 */
export async function getProductEAN(colruytId: string) {

    //https://www.colruyt.be/fr/produits/3079
    const colruytInfoUrl = await getHtmlFragment("https://www.colruyt.be/fr/produits/" + colruytId, '.product-detail__product-description-details>.product-detail__product-description-details>a').then(frag => frag?.attr("href"));

    return colruytInfoUrl && await getHtmlFragment(colruytInfoUrl, '#current_gtin').then(frag => frag?.text());
}


export async function getHtmlFragment(url: string, selector: string) {

    const proxied_url = proxify_url(new URL(url), new URL("/proxy", window.location.href).toString());
    const htmlStr = await fetch(proxied_url).then(resp => resp.text()).catch(err => {
        console.log(`Failed to fetch ${proxied_url} : ${err}`);
        if (err.code == 'UND_ERR_SOCKET') {
            // TODO retry ?
        }
        return undefined;
    });

    if (!htmlStr) return undefined;

    const $ = cheerio.load(htmlStr);
    return $(selector);
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
            if (!(item.article.vendorId in colruyt_items)) {
                if (!(item.article.vendorId in eanMap))
                    eanMapUpdate[item.article.vendorId] = {
                        ean: await getProductEAN(item.article.vendorId),
                        label: item.article.label
                    };
                else if (!eanMap[item.article.vendorId].label) {
                    eanMapUpdate[item.article.vendorId] = {...eanMap[item.article.vendorId], label: item.article.label};
                }
                const ean = eanMap[item.article.vendorId]?.ean || eanMapUpdate[item.article.vendorId]?.ean;

                colruyt_items[item.article.vendorId] = {...item, ean};
                if (ean && !(ean in off_items)) {
                    const itemFacts = (await fetchFoodFacts(ean)) || null;
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

/**
 * Browse a list of Colruyt receipts and gather product items, their respective EANs and related OpenFoodFacts data
 * @param receipts
 * @param progressMonitor
 */
export async function enrichArticles(articles: VendorArticle[], eanMap: ColruytEanMap, fetchOff?: boolean, progressMonitor?: (event: {
    items: Record<string, any>,
    off_items: Record<string, any>
}) => void) {

    const items: Record<string, any> = {};
    const off_items: Record<string, any> = {};
    const eanMapUpdate: ColruytEanMap = {};

    for (const item of articles) {
        if (!(item.vendorId in items)) {
            if (!(item.vendorId in eanMap))
                eanMapUpdate[item.vendorId] = {ean: await getProductEAN(item.vendorId), label: item.label};
            else if (!eanMap[item.vendorId].label) {
                eanMapUpdate[item.vendorId] = {...eanMap[item.vendorId], label: item.label};
            }
            const ean = eanMap[item.vendorId]?.ean || eanMapUpdate[item.vendorId]?.ean;

            items[item.vendorId] = {...item, ean};
            if (fetchOff && ean && !(ean in off_items)) {
                const itemFacts = (await fetchFoodFacts(ean)) || null;
                off_items[ean] = itemFacts;
            }

            progressMonitor && progressMonitor({
                items,
                off_items
            });
        }
    }


    return {
        items,
        off_items,
        eanMapUpdate
    }
}


export function enrichArticlesFromCache(articles: VendorArticle[]) {
    articles.forEach(a => {
        if (!a.ean) a.ean = !(a.vendorId in colruytIdMap) ? undefined : colruytIdMap[a.vendorId].off ? colruytIdMap[a.vendorId].off : colruytIdMap[a.vendorId].eans?.length > 0 ? colruytIdMap[a.vendorId].eans[0] : undefined;
    })
}