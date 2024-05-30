import {PodStorage} from "@hilats/solid-utils";
import {_404undefined, assert, MIME_REGISTRY, WELL_KNOWN_TYPES} from "@hilats/utils";
import {retail} from "@hilats/data-modules";

type Receipt = retail.Receipt;

export const PATH_PREFERENCES = 'preferences.json';
export const PATH_RETAILER_PREFIX = 'retailers/';
export const PATH_RETAILER_EIN_CACHE = 'ein_map.json';
export const PATH_RETAILER_EIN_MAP = 'ein_map.json';
export const PATH_RETAILER_HISTORY = 'history.json';

export type Preferences = any;

export type ReceiptsMap = Record<string, Receipt[]>;

const STORAGE : 'LDO' | 'JSONLD' | 'JSON' = 'JSONLD';

export interface ReceiptsStorage {

    listRetailers(): Promise<string[]>;

    fetchHistories(retailers: string[]): Promise<ReceiptsMap>;

    fetchHistory(retailer: string): Promise<Receipt[]>;

    saveHistory(receipts: Receipt[], retailer?: string): Promise<void>;
}

export class PodRetailStorage extends PodStorage implements ReceiptsStorage {

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
            // TODO refactor LDO schemas if it is to be supported again
            throw new Error("LDO Not supported");

            /*
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
                return [];
            }

             */
        } else if (STORAGE == "JSONLD") {
            const uri = this.getResourceUri(PATH_RETAILER_PREFIX + retailer + '/' + PATH_RETAILER_HISTORY.replace('.json', '.nq'));
            const ttl = await this.fetchFile(uri).catch(_404undefined).then(r => r?.text())

            const receipts = ttl ? await retail.DM_RETAIL.parseTriples([ttl], {base: uri}) : [];

            return receipts;
        } else {
            return await this.fetchJSON<Receipt[]>(PATH_RETAILER_PREFIX + retailer + '/' + PATH_RETAILER_HISTORY).catch(_404undefined) || []
        }
    }

    async saveHistory(receipts: Receipt[], retailer?: string) {

        // TODO support undefined retailer
        assert(retailer, "Retailer ID must be provided");

        // let's take the absolute URI so we can use it to base the triples
        let uri = this.getResourceUri(PATH_RETAILER_PREFIX + retailer + '/' + PATH_RETAILER_HISTORY);


        if (STORAGE == 'LDO') {
            // TODO refactor LDO schemas if it is to be supported again
            throw new Error("LDO Not supported");

            /*
            const ldoDataset = createLdoDataset();
            const ldoReceiptBuilder = ldoDataset.usingType(ReceiptShapeType);

            receipts.forEach(r => ldoReceiptBuilder.fromJson(r));

            const ttl = datasetToString(ldoDataset, {});

            uri = MIME_REGISTRY.substituteExtension(uri, WELL_KNOWN_TYPES.ttl);

            await this.putFile(uri, new Blob([ttl], {type: WELL_KNOWN_TYPES.ttl})).catch(_404undefined);


             */
        } else if (STORAGE == "JSONLD") {
            uri = MIME_REGISTRY.substituteExtension(uri, WELL_KNOWN_TYPES.nq);

            const ttl = await retail.DM_RETAIL.serialize(receipts, {base: uri, contentType: WELL_KNOWN_TYPES.nq})

            await this.putFile(uri, new Blob([ttl], {type: WELL_KNOWN_TYPES.nq})).catch(_404undefined);

        } else {
            await this.putJSON(uri, receipts).catch(_404undefined);
        }
    }

    fetchEanCache() {
        return this.fetchJSON<Receipt[]>(PATH_RETAILER_EIN_CACHE).catch(_404undefined);
    }
}



export function getVendorId(receiptId: string) {
    try {
        const url = new URL(receiptId);
        if (url.origin) return url.host;
        else if (url.protocol) return url.protocol.slice(0, -1);
    } catch (err) {
        // it's not aURL
    }

    return receiptId;
}

export class MemoryReceiptsStorage implements ReceiptsStorage {

    private _receipts$: Promise<ReceiptsMap>;
    
    constructor(options: {uris?: string[], receiptMap?: ReceiptsMap, receipts?: Receipt[], fetch?: typeof global.fetch}) {

        const {uris, receipts, receiptMap, fetch = global.fetch} = options;
        
        if (receiptMap)
            this._receipts$ = Promise.resolve(receiptMap);
        else
            this._receipts$ = Promise.resolve({});
        
        if (receipts) this._receipts$ = this._receipts$.then(map => {
            receipts.forEach(r => {
                const vendorId = getVendorId(r.id);
                if (vendorId in map) map[vendorId].push(r);
                else map[vendorId] = [r];
            });

            return map;
        });

        if (uris) this._receipts$ = this._receipts$.then(async map => {
            for (const uri of uris) {
                // TODO check return content type ?
                const ttlStr = await fetch(uri).then(resp => resp.text())
                const receipts = await retail.DM_RETAIL.parseTriples([ttlStr], {base: uri});

                receipts.forEach(r => {
                    const vendorId = getVendorId(r.id);
                    if (vendorId in map) map[vendorId].push(r);
                    else map[vendorId] = [r];
                });
            }
            return map;
        });
    }

    fetchHistories(retailers: string[]): Promise<ReceiptsMap> {
        return this._receipts$;
    }

    listRetailers(): Promise<string[]> {
        return this._receipts$.then(map => Object.keys(map));
    }

    fetchHistory(retailer: string): Promise<Receipt[]> {
        return this._receipts$.then(map => map[retailer]);
    }

    async saveHistory(receipts: Receipt[], retailer?: string): Promise<any> {
        this._receipts$ = this._receipts$.then(map => {
            receipts.forEach(r => {
                const retailerId = retailer || getVendorId(r.id);
                if (retailerId in map) map[retailerId].push(r);
                else map[retailerId] = [r];
            });

            return map;
        });

        return this._receipts$;
    }


}



/**
 * Implements a ReceiptsStorage on top of a (set of) resources or a rdflib graph
 */
/*
export class ResourceReceiptsStorage implements ReceiptsStorage {

    private _graph: rdflib.Store;


    constructor(graph: rdflib.Store) {
        this._graph = graph;
    }

    fetchHistories(retailers: string[]): Promise<ReceiptsMap> {
        this._graph;

        throw new Error("Not Implemented");
        //return Promise.resolve(undefined);
    }

    listRetailers(): Promise<string[]> {
        throw new Error("Not Implemented")
        //return Promise.resolve([]);
    }
}

 */