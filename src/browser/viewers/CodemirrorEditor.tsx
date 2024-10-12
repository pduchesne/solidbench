import React, {useEffect, useState } from "react";
import {ContentEditor} from "./GenericEditor";
import {PromiseStateContainer, usePromiseFn} from "@hilats/react-utils";
import {ResourceAction} from "../pod-browser";
import SaveIcon from '@mui/icons-material/Save';
import {UnControlled as CodeMirror} from "react-codemirror2";
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/material.css';
import 'codemirror/mode/xml/xml';
import 'codemirror/mode/turtle/turtle';
import 'codemirror/mode/javascript/javascript';

export const CodemirrorEditor: ContentEditor = (props) => {

    const [updatedContent, setUpdatedContent] = useState<string | undefined>();
    const [isDirty, setIsDirty] = useState(false);

    const {onSave, setResourceActions} = props;

    useEffect(() => {
        if (setResourceActions && onSave) {
            const actions: ResourceAction[] = [];

            if (isDirty) {
                actions.push(
                    {
                        title: 'Save',
                        icon: SaveIcon,
                        onClick: async () => {
                            updatedContent && await onSave(updatedContent);
                            setIsDirty(false);
                        }
                    }
                );
            }

            setResourceActions(actions);
        }
    }, [isDirty, updatedContent, setResourceActions, onSave]);

    const contentString$ = usePromiseFn( async () => {
        return props.content instanceof Blob ? props.content.text() : props.content;
    }, [props.content]);

    return <PromiseStateContainer promiseState={contentString$}>
        {(content) =>
            <CodeMirror  value={content}
                         options={{
                         theme: 'material',
                          lineNumbers: true
                         }}
                         onChange={((editor, data, value) => {
                             setIsDirty(true);
                             setUpdatedContent(value);
                         })} />
           }
    </PromiseStateContainer>

}

export default CodemirrorEditor;