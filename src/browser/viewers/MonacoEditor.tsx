import React, {useCallback, useContext, useState} from "react";
import {ContentEditor} from "./GenericEditor";
import {PromiseStateContainer, usePromiseFn} from "@hilats/react-utils";
import {Editor} from "@monaco-editor/react";
import {registerTurtle} from "@hilats/monaco-language-turtle";
import {WELL_KNOWN_TYPES} from "@hilats/utils";
import {AppContext} from "../../appContext";
import * as rdflib from 'rdflib';

import * as monaco from 'monaco-editor';
import {loader} from "@monaco-editor/react";
loader.config({ monaco });

const LANGUAGES: Record<string, string> = {
    [WELL_KNOWN_TYPES.ttl] : 'turtle',
    [WELL_KNOWN_TYPES.json] : 'json',
    [WELL_KNOWN_TYPES.md] : 'markdown',
}

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

export const MonacoEditor: ContentEditor = (props) => {
    const ctx = useContext(AppContext);

    const language = (props.type && LANGUAGES[props.type]) || 'javascript';
    const [editor, setEditor] = useState<any>();
    // TODO have a dark turtle mode
    const theme = language == 'turtle' ? (ctx.theme == 'dark' ? 'turtleThemeDark' : 'turtleTheme') : ctx.theme == 'dark' ? 'vs-dark' : undefined;

    const contentString$ = usePromiseFn( async () => {
        return props.content instanceof Blob ? props.content.text() : props.content;
    }, [props.content]);

    const onMountCb = useCallback( (editor: any, monaco: any) => {
        registerTurtle(monaco);
        setEditor(editor);
        if (language == 'turtle') {
            const rdfGraph = parseRdf(editor.getValue(), props.uri || 'http://test.com');
            const model = editor.getModel();
            model.rdfGraph = rdfGraph;
        }

    }, [])

    return <PromiseStateContainer promiseState={contentString$}>
        {(content) =>     <Editor
            //height="90vh"
            //defaultLanguage="javascript"
            value={content}
            theme={theme}
            language={language}
            onMount={onMountCb}
            onChange={(value, ev) => {
                // TODO
                if (language == 'turtle') {
                    const rdfGraph = parseRdf(editor.getValue(), props.uri || 'http://test.com');
                    const model = editor.getModel();
                    model.rdfGraph = rdfGraph;
                }
            }}
            //defaultValue="// some comment"
            //onChange={props.}
        />}
    </PromiseStateContainer>

}

export default MonacoEditor;