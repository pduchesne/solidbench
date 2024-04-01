import {PodStorage} from "@hilats/solid-utils";
import {Receipt} from "./model";
import {_404undefined} from "@hilats/utils";


export const PATH_PREFERENCES = 'preferences.json';
export const PATH_RETAILER_PREFIX = 'retailers/';
export const PATH_RETAILER_EIN_CACHE = 'ein_map.json';
export const PATH_RETAILER_EIN_MAP = 'ein_map.json';
export const PATH_RETAILER_HISTORY = 'history.json';

export type Preferences = any;

export type ReceiptsMap = Record<string, Receipt[]>;

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

    async fetchHistory(retailers: string[]) {
        const histories = await Promise.all(retailers.map(retailer => {
            return this.fetchJSON<Receipt[]>(PATH_RETAILER_PREFIX + retailer + '/' + PATH_RETAILER_HISTORY).catch(_404undefined).then(res => [retailer, res || []] as [string, Receipt[]]);
        }));
        return histories.reduce<ReceiptsMap>((map, [retailer, receipts]) => {
            map[retailer] = receipts;
            return map;
        }, {});
    }

    saveHistory(retailer: string, receipts: Receipt[]) {
        return this.putJSON(PATH_RETAILER_PREFIX + retailer + '/' + PATH_RETAILER_HISTORY, receipts).catch(_404undefined);
    }

    fetchEanCache() {
        return this.fetchJSON<Receipt[]>(PATH_RETAILER_EIN_CACHE).catch(_404undefined);
    }
}