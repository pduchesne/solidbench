import { readFileSync} from "node:fs";
import officeCrypto from "officecrypto-tool";
import readXlsxFile from "read-excel-file/node";
import {parseXlsxExport} from "./parser";


test('Parse Encrypted XLSX', async () => {

    let input = await readFileSync(`./static/case_02418898.xlsx`);
    const isEncrypted = officeCrypto.isEncrypted(input);

    if (isEncrypted) {
        input = await officeCrypto.decrypt(input, {password: 'g4qMBh'});
    }

    let tickets = await readXlsxFile(input, { sheet: 1 });

    let items = await readXlsxFile(input, { sheet: 2 });

    tickets;
    items;
})

test('Parse using parser', async () => {

    let input = await readFileSync(`./static/case_02418898.xlsx`);

    const receipts = await parseXlsxExport(input);

    receipts;
})