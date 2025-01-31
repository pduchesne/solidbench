import React, {useCallback, useState} from "react";
import {Editor} from "@monaco-editor/react";
import {registerTurtle, TOOLTIPS} from "@hilats/monaco-language-turtle";
import {WELL_KNOWN_TYPES} from "@hilats/utils";
import * as rdflib from 'rdflib';

import * as monaco from 'monaco-editor';
import {loader} from "@monaco-editor/react";
import {MODULE_REGISTRY} from "@hilats/data-modules";
loader.config({ monaco });

Object.entries(MODULE_REGISTRY.items).forEach( ([key, module])  => {
    //@ts-ignore
    module.tooltipProducers?.length && TOOLTIPS.push(...module.tooltipProducers);
})


function parseRdf(str: string, base: string) {
    const store = rdflib.graph();
    try {
        str && rdflib.parse(str, store, base, WELL_KNOWN_TYPES.ttl);
    } catch (err) {
        console.warn("Failed to parse turtle: ");
        console.error(err);
    }

    return store;
}

export const MonacoEditor = (props: {theme?: string, language: string, content: string, uri?: string, onChange?: (content: string | undefined) => void}) => {

    const [editor, setEditor] = useState<any>();

    const theme = props.language == 'turtle' ? (props.theme == 'dark' ? 'turtleThemeDark' : 'turtleTheme') : props.theme == 'dark' ? 'vs-dark' : undefined;


    const onMountCb = useCallback( (editor: any, monaco: any) => {
        registerTurtle(monaco);
        setEditor(editor);
        if (props.language == 'turtle') {
            const rdfGraph = parseRdf(editor.getValue(), props.uri || 'http://test.com');
            const model = editor.getModel();
            model.rdfGraph = rdfGraph;
        }

    }, [props.language])

    return <Editor
        //height="90vh"
        //defaultLanguage="javascript"
        value={props.content}
        theme={theme}
        language={props.language}
        onMount={onMountCb}
        onChange={(value, ev) => {
            // TODO
            if (props.language == 'turtle') {
                const rdfGraph = parseRdf(editor.getValue(), props.uri || 'http://test.com');
                const model = editor.getModel();
                model.rdfGraph = rdfGraph;
            }

            props.onChange && props.onChange(value);
        }}
        //defaultValue="// some comment"
        //onChange={props.}
    />

}

export default MonacoEditor;