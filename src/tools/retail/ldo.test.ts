import {getLogger} from "log4js";
import {createLdoDataset, parseRdf} from "@ldo/ldo";
import {Receipt} from "../../ldo/retail.typings";
import {ReceiptShapeType} from "../../ldo/retail.shapeTypes";
import {datasetToString} from "@ldo/rdf-utils";

jest.setTimeout(3000000);

const log = getLogger('test');
log.level = "debug";

test('Serialize Receipt', async () => {
    const receipt: Receipt = {
        receiptId: '123',
        date: new Date().toISOString(),
        storeId: 'store1',
        storeName: 'store name 1',
        totalAmount: 20.25,
        items: [
            {date: new Date().toISOString(),
                quantity: 1,
                unitPrice: 10.0,
                amount: 10.0,
                article: {
                vendorId: 'colruyt',
                    label: 'test',

                }
            }
        ],
        shippingCosts: 0
    };

    const ldoDataset = createLdoDataset();
    ldoDataset
        .usingType(ReceiptShapeType)
        .fromJson(receipt);

    ldoDataset
        .usingType(ReceiptShapeType)
        .fromJson({
            receiptId: '456',
            date: new Date().toISOString(),
            storeId: 'store2',
            storeName: 'store name 2',
            totalAmount: 30,
            items: [],
            shippingCosts: 0
        });

    const ttl = datasetToString(ldoDataset, {}); //await toTurtle(ldoReceipt);

    ttl;


    const parsedDataset = await parseRdf(ttl);
    const parsedReceipts = parsedDataset
        // Tells the LDO dataset that we're looking for a FoafProfile
        .usingType(ReceiptShapeType)
        // Says the subject of the FoafProfile
        .matchSubject('http://example.org/receiptId')

    parsedReceipts

    const parsedReceipt = parsedDataset.usingType(ReceiptShapeType).fromSubject("456" );
    parsedReceipt;
});

