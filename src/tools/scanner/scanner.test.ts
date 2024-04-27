import {getLogger} from "log4js";
import { scanResource} from "./index";
import {buildThing, createSolidDataset, createThing, saveSolidDatasetInContainer, setThing} from "@inrupt/solid-client";
import { SCHEMA_INRUPT, RDF } from "@inrupt/vocab-common-rdf";

jest.setTimeout(3000000);

const log = getLogger('test');
log.level = "debug";

const TEST_FOLDER = 'https://pduchesne.solidcommunity.net/test/';

test('Write test resources', async () => {
    let courseSolidDataset = createSolidDataset();
    const newBookThing1 = buildThing(createThing({ name: "book1" }))
        .addStringNoLocale(SCHEMA_INRUPT.name, "ABC123 of Example Literature")
        .addUrl(RDF.type, "https://schema.org/Book")
        .build();

    courseSolidDataset = setThing(courseSolidDataset, newBookThing1);

    await saveSolidDatasetInContainer(TEST_FOLDER, courseSolidDataset);
});

test('Scan folder - no shapes', async () => {
    const metadata = await scanResource(TEST_FOLDER);

    metadata.name;
});


const testShapes = {bookTest1:
        `
start = @<Book>

<Book> {
  <http://schema.org/name> . ;
}
`, bookTest2:
        `
start = @<Book>

<Book> {
  a [<https://schema.org/Book>] ;
}
`}

test('Scan folder - shapes', async () => {
    const metadata = await scanResource(TEST_FOLDER, {shapes: testShapes});

    metadata.name;
});
