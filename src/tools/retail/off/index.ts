import {throwOnHttpStatus} from "@hilats/utils";

const OFF_APIV2_ROOT = 'https://world.openfoodfacts.net/api/v2'

// TODO use openfoodfacts-nodejs ?

export async function fetchFoodFacts(ean: string) {
    const data = await fetch(OFF_APIV2_ROOT + '/product/' + ean + '?fields=code,product_name,nutriscore_data,categories_tags,ecoscore_grade,food_groups,image_url,nutrient_levels,nutriscore_grade,completeness').then(throwOnHttpStatus).then(resp => resp.json());

    return data;
}