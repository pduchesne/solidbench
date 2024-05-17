import React, {useContext, lazy, Suspense} from "react";
import {ContentEditor} from "./GenericEditor";
import {DEFAULTS, PromiseStateContainer, usePromiseFn} from "@hilats/react-utils";
import {WELL_KNOWN_TYPES} from "@hilats/utils";
import {AppContext} from "../../appContext";

const LANGUAGES: Record<string, string> = {
    [WELL_KNOWN_TYPES.ttl] : 'turtle',
    [WELL_KNOWN_TYPES.json] : 'json',
    [WELL_KNOWN_TYPES.md] : 'markdown',
}

const MonacoComponent = lazy(() => import('../../ui/monaco'));

export const MonacoEditor: ContentEditor = (props) => {
    const ctx = useContext(AppContext);

    const language = (props.type && LANGUAGES[props.type]) || 'javascript';

    const contentString$ = usePromiseFn( async () => {
        return props.content instanceof Blob ? props.content.text() : props.content;
    }, [props.content]);

    return <PromiseStateContainer promiseState={contentString$}>
        {(content) =>
            <Suspense fallback={<DEFAULTS.Loader />}>
                <MonacoComponent
                    content={content}
                    uri={props.uri}
                    theme={ctx.theme}
                    language={language}
                    //defaultValue="// some comment"
                    //onChange={props.}
                />
            </Suspense>
            }
    </PromiseStateContainer>

}

export default MonacoEditor;