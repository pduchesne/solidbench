import {PodStorage} from "@hilats/solid-utils";
import {_404undefined, MIME_REGISTRY, WELL_KNOWN_TYPES} from "@hilats/utils";
import {createLdoDataset, parseRdf} from "@ldo/ldo";
import {ReceiptShapeType} from "../../ldo/retail.shapeTypes";
import {datasetToString} from "@ldo/rdf-utils";
import {retail} from "@hilats/data-modules";

//import {Receipt} from "./model";
type Receipt = retail.Receipt;

export const PATH_PREFERENCES = 'preferences.json';
export const PATH_RETAILER_PREFIX = 'retailers/';
export const PATH_RETAILER_EIN_CACHE = 'ein_map.json';
export const PATH_RETAILER_EIN_MAP = 'ein_map.json';
export const PATH_RETAILER_HISTORY = 'history.json';

export type Preferences = any;

export type ReceiptsMap = Record<string, Receipt[]>;

const STORAGE : 'LDO' | 'JSONLD' | 'JSON' = 'JSONLD';

export class RetailStorage extends PodStorage {

    constructor(podUri: string, options?: { fetch?: typeof fetch, podFolder?: string }) {
        const podFolder = options?.podFolder || 'retail/';
        super(podUri + podFolder, options);
    }

    async listRetailers() {
        const retailers = await this.listContainerResources(PATH_RETAILER_PREFIX, {fetch: this.fetch})
            .then(urls =>
                urls.filter(url => url.endsWith('/'))
                    .map(url => url.split('/').at(-2))
                    .filter(name => !!name));

        return retailers as string[];
    }

    fetchPreferences() {
        return this.fetchJSON<Preferences>(PATH_PREFERENCES);
    }

    savePreferences(preferences: Preferences) {
        return this.putJSON(PATH_PREFERENCES, preferences);
    }

    async fetchHistories(retailers: string[]) {
        const histories = await Promise.all(retailers.map(async retailer => {
            const history = await this.fetchHistory(retailer);
            return [retailer, history || []] as [string, Receipt[]];
        }));
        return histories.reduce<ReceiptsMap>((map, [retailer, receipts]) => {
            map[retailer] = receipts;
            return map;
        }, {});
    }

    async fetchHistory(retailer: string) {
        if (STORAGE == 'LDO') {
            const ttl = await this.fetchFile(PATH_RETAILER_PREFIX + retailer + '/' + PATH_RETAILER_HISTORY.replace('.json', '.ttl')).catch(_404undefined).then(r => r?.text())

            if (ttl) {
                const parsedDataset = await parseRdf(ttl);
                const parsedReceipts = parsedDataset
                    // Tells the LDO dataset that we're looking for a FoafProfile
                    .usingType(ReceiptShapeType)
                    // Says the subject of the FoafProfile
                    .matchSubject('http://example.org/receiptId')
                return parsedReceipts;
            } else {
                return undefined;
            }
        } else if (STORAGE == "JSONLD") {
            const uri = this.getResourceUri(PATH_RETAILER_PREFIX + retailer + '/' + PATH_RETAILER_HISTORY.replace('.json', '.nq'));
            const ttl = await this.fetchFile(uri).catch(_404undefined).then(r => r?.text())

            const receipts = ttl ? await retail.DM_RETAIL.parseTriples([ttl], {base: uri}) : undefined;

            return receipts;
        } else {
            return this.fetchJSON<Receipt[]>(PATH_RETAILER_PREFIX + retailer + '/' + PATH_RETAILER_HISTORY).catch(_404undefined)
        }
    }

    async saveHistory(retailer: string, receipts: Receipt[]) {

        // let's take the absolute URI so we can use it to base the triples
        let uri = this.getResourceUri(PATH_RETAILER_PREFIX + retailer + '/' + PATH_RETAILER_HISTORY);

        if (STORAGE == 'LDO') {
            const ldoDataset = createLdoDataset();
            const ldoReceiptBuilder = ldoDataset.usingType(ReceiptShapeType);

            receipts.forEach(r => ldoReceiptBuilder.fromJson(r));

            const ttl = datasetToString(ldoDataset, {});

            uri = MIME_REGISTRY.substituteExtension(uri, WELL_KNOWN_TYPES.ttl);

            return this.putFile(uri, new Blob([ttl], {type: WELL_KNOWN_TYPES.ttl})).catch(_404undefined);

        } else if (STORAGE == "JSONLD") {
            uri = MIME_REGISTRY.substituteExtension(uri, WELL_KNOWN_TYPES.nq);

            const ttl = await retail.DM_RETAIL.serialize(receipts, {base: uri, contentType: WELL_KNOWN_TYPES.nq})

            return this.putFile(uri, new Blob([ttl], {type: WELL_KNOWN_TYPES.nq})).catch(_404undefined);

        } else {
            return this.putJSON(uri, receipts).catch(_404undefined);
        }
    }

    fetchEanCache() {
        return this.fetchJSON<Receipt[]>(PATH_RETAILER_EIN_CACHE).catch(_404undefined);
    }
}