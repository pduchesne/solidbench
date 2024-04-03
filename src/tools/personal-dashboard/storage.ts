import {PodStorage} from "@hilats/solid-utils";
import {_404undefined} from "@hilats/utils";
import {Preferences} from "./preferences";


export const PATH_PREFERENCES = 'preferences.json';

export class SolidAppStorage extends PodStorage {

    constructor(podUri: string, options?: { fetch?: typeof fetch}) {
        const podFolder = '.solidbench/';
        super(podUri + podFolder, options);
    }

    fetchPreferences() {
        return this.fetchJSON<Preferences>(PATH_PREFERENCES);
    }

    savePreferences(preferences: Preferences) {
        return this.putJSON(PATH_PREFERENCES, preferences);
    }

}