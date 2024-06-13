import {throwOnHttpStatus} from "@hilats/utils";

const OFF_APIV2_ROOT = 'https://world.openfoodfacts.net/api/v2'

export type OffMetadata = {
    "categories_tags": string[],
    "code": string,
    //"completeness": number,
    "ecoscore_grade": string,
    "food_groups": string,
    "image_url": string,
    "nutrient_levels": Record<string, string>,
    /*
    "nutriscore_data": {
        "energy": null,
        "energy_points": number,
        "energy_value": number,
        "fiber": number,
        "fiber_points": number,
        "fiber_value": number,
        "fruits_vegetables_nuts_colza_walnut_olive_oils": number,
        "fruits_vegetables_nuts_colza_walnut_olive_oils_points": number,
        "fruits_vegetables_nuts_colza_walnut_olive_oils_value": number,
        "grade": string,
        "is_beverage": number,
        "is_cheese": number,
        "is_fat": number,
        "is_water": string,
        "negative_points": number,
        "positive_points": number,
        "proteins": null,
        "proteins_points": number,
        "proteins_value": number,
        "saturated_fat": null,
        "saturated_fat_points": number,
        "saturated_fat_value": number,
        "score": number,
        "sodium": number,
        "sodium_points": number,
        "sodium_value": number,
        "sugars": null,
        "sugars_points": number,
        "sugars_value": number
    },
     */
    "nutriscore_grade": string,
    "product_name": string
}

// TODO use openfoodfacts-nodejs ?


export async function fetchFoodFacts(gtin: string) {
    const data = await fetch(OFF_APIV2_ROOT + '/product/' + gtin + '?fields=code,product_name,nutriscore_data,categories_tags,ecoscore_grade,food_groups,image_url,nutrient_levels,nutriscore_grade,completeness').then(throwOnHttpStatus).then(resp => resp.json());

    return data?.product as (OffMetadata | undefined);
}