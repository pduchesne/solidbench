import {PodStorage} from "@hilats/solid-utils";
import {Receipt} from "./model";
import {_404undefined} from "@hilats/utils";


export const PATH_PREFERENCES = 'preferences.json';
export const PATH_RETAILER_PREFIX = 'retailers/';
export const PATH_RETAILER_EIN_CACHE = 'ein_map.json';
export const PATH_RETAILER_EIN_MAP = 'ein_map.json';
export const PATH_RETAILER_HISTORY = 'history.json';

export type Preferences = any;

export class RetailStorage extends PodStorage {

    constructor(podUri: string, options?: { fetch?: typeof fetch }) {
        super(podUri, options);
    }

    fetchPreferences() {
        return this.fetchJSON<Preferences>(PATH_PREFERENCES);
    }

    savePreferences(preferences: Preferences) {
        return this.putJSON(PATH_PREFERENCES, preferences);
    }

    fetchHistory(retailer: string) {
        return this.fetchJSON<Receipt[]>(PATH_RETAILER_PREFIX+retailer+'/'+PATH_RETAILER_HISTORY).catch(_404undefined);
    }

    saveHistory(retailer: string, receipts: Receipt[]) {
        return this.putJSON(PATH_RETAILER_PREFIX+retailer+'/'+PATH_RETAILER_HISTORY, receipts).catch(_404undefined);
    }

    fetchEanCache() {
        return this.fetchJSON<Receipt[]>(PATH_RETAILER_EIN_CACHE).catch(_404undefined);
    }
}