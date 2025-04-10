import React, {useContext, lazy, Suspense, useState, useEffect} from "react";
import {ContentEditor, ResolvedContentEditorProps} from "./GenericEditor";
import {DEFAULTS, PromiseStateContainer, usePromiseFn} from "@hilats/react-utils";
import {WELL_KNOWN_TYPES} from "@hilats/utils";
import {AppContext} from "../../appContext";
import SaveIcon from '@mui/icons-material/Save';
import {ResourceAction} from "../pod-browser";
import {APP_ROOT} from "../../index";
import { MODULE_REGISTRY } from "@hilats/data-modules";
import {Link as RouterLink} from 'react-router-dom';
import { toast } from "react-toastify";
import {withResolvableUri} from "./GenericViewer";

const LANGUAGES: Record<string, string> = {
    [WELL_KNOWN_TYPES.nq] : 'turtle',
    [WELL_KNOWN_TYPES.nt] : 'turtle',
    [WELL_KNOWN_TYPES.ttl] : 'turtle',
    [WELL_KNOWN_TYPES.json] : 'json',
    [WELL_KNOWN_TYPES.md] : 'markdown',
    ["text/reveal+markdown"] : 'markdown',
}

const MonacoComponent = lazy(() => import('../../ui/monaco'));

export const ResolvedMonacoEditor = (props: ResolvedContentEditorProps) => {
    const ctx = useContext(AppContext);

    const [updatedContent, setUpdatedContent] = useState<string | undefined>();
    const [isDirty, setIsDirty] = useState(false);

    const {setResourceActions, resource } = props;
    const {onSave} = resource;

    const language = (resource.type && LANGUAGES[resource.type]) || 'javascript';

    const contentString$ = usePromiseFn( async () => {
            const contentString = resource.content instanceof Blob ?
                (await resource.content.text()) :
                resource.content;

            if (contentString && resource.uri &&
                (resource.type == WELL_KNOWN_TYPES.ttl || resource.type == WELL_KNOWN_TYPES.nq || resource.type == WELL_KNOWN_TYPES.nt)) {
                Object.entries(MODULE_REGISTRY.items).forEach(([key, module]) => {
                    module.matches(contentString, resource.type).then(result => {
                        if (result.matches.length)
                            toast(() => <div>
                                This resource can be best viewed in your <RouterLink
                                to={`${APP_ROOT}${key}?input=${encodeURIComponent(resource.uri!)}`}>{key} dashboard</RouterLink>
                            </div>);
                    })
                })
            }

            return contentString;
        },
        [resource]
    );

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

    return <PromiseStateContainer promiseState={contentString$}>
        {(content) =>
            <Suspense fallback={<DEFAULTS.Loader message="Loading UI..."/>}>
                <MonacoComponent
                    content={content!}
                    uri={resource.uri}
                    theme={ctx.theme}
                    language={language}
                    //defaultValue="// some comment"
                    onChange={(content) => {
                        setIsDirty(true);
                        setUpdatedContent(content);
                    }}
                />
            </Suspense>
            }
    </PromiseStateContainer>
}

export const MonacoEditor: ContentEditor = withResolvableUri(ResolvedMonacoEditor);

export default MonacoEditor;