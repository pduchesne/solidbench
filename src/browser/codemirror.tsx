import * as React from "react";
import {IUnControlledCodeMirror, UnControlled as CodeMirror} from "react-codemirror2";
import {useCallback, useEffect, useState} from "react";
import {Editor} from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/material.css';
import 'codemirror/mode/xml/xml';
import 'codemirror/mode/turtle/turtle';
import 'codemirror/mode/javascript/javascript';
import Button from "@mui/material/Button/Button";


export const DirtyCodemirror = (props: IUnControlledCodeMirror) => {
    const [currentContent, setCurrentContent] = useState<string>('');

    useEffect(() => {
        setCurrentContent(props.value || '');
    }, [props.value]);

    const isDirty = currentContent != (props.value || '');

    const onBlurCb = useCallback((editor: Editor) => setCurrentContent(editor.getValue()), [setCurrentContent, currentContent])

    // because of this codemirror bug, the CodeMirror element is not updated on callback changes. https://github.com/scniro/react-codemirror2/issues/142
    // --> force the update with a key change
    return <div style={{position: "relative"}}>
        <CodeMirror {...{
            ...props,
            onChange: undefined,
            options: {...props.options}
        }} onBlur={onBlurCb} value={currentContent}/>
        <div style={{position: "absolute", right: "5px", top: "5px", zIndex: 10}}>
            {isDirty ? <Button
                color="secondary"
                onClick={() => props.onChange && props.onChange(undefined as any, undefined as any, currentContent)}>Save</Button> : null}
        </div>
    </div>
}
