import {WELL_KNOWN_TYPES} from "@hilats/utils";
import React, {useMemo} from "react";
import {ContentViewerProps, guessContentType} from "./GenericViewer";
import CodemirrorEditor from "./CodemirrorEditor";
import MonacoEditor from "./MonacoEditor";

export type ContentEditorProps = ContentViewerProps & {onSave?: (content: Blob | string) => Promise<void>};
export type ContentEditor = React.ComponentType<ContentEditorProps>;

const EDITORS: Record<string, ContentEditor> = {
    [WELL_KNOWN_TYPES.ttl]: MonacoEditor,
    [WELL_KNOWN_TYPES.json]: MonacoEditor,
    [WELL_KNOWN_TYPES.md]: MonacoEditor
}

const DEFAULT_EDITOR = CodemirrorEditor;

export function getEditor(uri?: string, type?: string, content?: string | Blob): [ContentEditor, string | undefined] {
    let contentType = guessContentType(content, type, uri);

    return [
        (contentType && EDITORS[contentType]) || DEFAULT_EDITOR,
        contentType
        ];
}

export const GenericEditor: ContentEditor = (props) => {

    const [Editor, contentType] = useMemo(()=> getEditor(props.uri, props.type, props.content), [props.content, props.type, props.uri]);

    return <Editor {...props} type={contentType}/>;
}