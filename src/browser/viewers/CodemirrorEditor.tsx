import React from "react";
import {ContentEditor} from "./GenericEditor";
import {DirtyCodemirror} from "../codemirror";
import {PromiseStateContainer, usePromiseFn} from "@hilats/react-utils";

export const CodemirrorEditor: ContentEditor = (props) => {

    const contentString$ = usePromiseFn( async () => {
        return props.content instanceof Blob ? props.content.text() : props.content;
    }, [props.content]);

    return <PromiseStateContainer promiseState={contentString$}>
        {(content) => <DirtyCodemirror
            value={content}
            options={{
                theme: 'material',
                lineNumbers: true
            }}
            onChange={((editor, data, value) => {
                props.onSave && props.onSave(value);
            })}
        />}
    </PromiseStateContainer>

}

export default CodemirrorEditor;