//@ts-ignore
import {ctor as RdfJsDb} from "@shexjs/neighborhood-rdfjs";
import shexParser from "@shexjs/parser";
import n3 from "n3";
import {ShExJsResultMapEntry, ShExValidator} from "@shexjs/validator";


export type ScanResult = {node: string, status: ShExJsResultMapEntry['status']}

export function findMatches(shexc: string, turtle: string, baseUri: string = "") {

    const schema = shexParser.construct(baseUri).parse(shexc);
    const quads = new n3.Parser({baseIRI: baseUri}).parse(turtle);
    const g = new n3.Store(quads);

    const subjects = g.getSubjects(null, null, null);
    const shapeMap = subjects.map(s => ({node: s.id, shape: ShExValidator.Start as any}))

    const validator = new ShExValidator(schema, RdfJsDb(g));


    let result: ScanResult[] = validator.validateShapeMap(shapeMap).map(res => ({node: res.node, status: res.status}));

    return result;
}