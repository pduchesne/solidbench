import {
    Access,
    AccessModes,
    getAgentDefaultAccessAll,
    getAgentResourceAccessAll,
    getFallbackAcl,
    getPublicDefaultAccess,
    getPublicResourceAccess,
    getResourceAcl,
    getResourceInfoWithAcl,
    WithAcl,
    WithServerResourceInfo
} from "@inrupt/solid-client";

import * as React from "react";
import {useCallback} from "react";
import {usePromiseFn} from "@hilats/react-utils";
import { wac } from "@hilats/solid-utils";
import Checkbox from "@mui/material/Checkbox/Checkbox";

export function useAclAccess(resUri: string, fetchFn: typeof fetch = fetch) {

    const resInfo$ = usePromiseFn(async () => {
        const resInfo = await getResourceInfoWithAcl(resUri, {fetch: fetchFn});

        const resourceAcl = getResourceAcl(resInfo);
        const fallbackAcl = getFallbackAcl(resInfo);

        // let's assume this is not an ACL-controlled resource if none is present
        return (resourceAcl || fallbackAcl) ? resInfo : null;
    }, [resUri, fetchFn])

    const setPublic = useCallback(async (access: Access) => {
        if (resInfo$.result) {
            await wac.setWacPublicResourceAccess(resInfo$.result, wac.aclAccessToUniversal(access), {fetch});
            resInfo$.fetch();
        }
    }, [resInfo$]);

    const setAccessModes = useCallback(async (webId: string, accessModes: Partial<AccessModes>) => {
        if (resInfo$.result) {
            await wac.setWacAgentResourceAccess(resInfo$.result, webId, accessModes as AccessModes, {fetch});
            resInfo$.fetch();
        }
    }, [resInfo$]);

    return {
        resInfo$,
        setPublic,
        setAccessModes
    };
}

export const AclAccessCheckbox = (props: {
    mode: keyof Access,
    accessModes: Access,
    onChange?: (access: Access) => void
}) => {
    return <Checkbox checked={props.accessModes[props.mode]} disabled={!props.onChange}
                     onChange={(event, checked) => props.onChange!({
                         ...props.accessModes,
                         [props.mode]: checked
                     })}/>
}
export const AclAccessForm = (props: {
    resInfo: WithAcl & WithServerResourceInfo,
    onChangePublic: (access: Access) => void,
    onChange: (entity: string, access: Access) => void
}) => {

    const resourceAcl = getResourceAcl(props.resInfo);
    const fallbackAcl = getFallbackAcl(props.resInfo);
    const resourcePublicAccess = resourceAcl && getPublicResourceAccess(resourceAcl);
    const defaultPublicAccess = fallbackAcl && getPublicDefaultAccess(fallbackAcl);
    const resourceAgentAccess = resourceAcl && getAgentResourceAccessAll(resourceAcl);
    const defaultAgentAccess = fallbackAcl && getAgentDefaultAccessAll(fallbackAcl);

    return (
        <div>
            <h4>WAC</h4>
            <table>
                <thead>
                <tr>
                    <th>entity</th>
                    <th>R</th>
                    <th>A</th>
                    <th>W</th>
                    <th>C</th>
                </tr>
                </thead>
                <tbody>
                <tr>
                    <td>{resourcePublicAccess ? 'Public' : 'Inherited Public'}</td>
                    <td><AclAccessCheckbox accessModes={(resourcePublicAccess || defaultPublicAccess)!} mode='read'
                                           onChange={props.onChangePublic}/></td>
                    <td><AclAccessCheckbox accessModes={(resourcePublicAccess || defaultPublicAccess)!} mode='append'
                                           onChange={props.onChangePublic}/></td>
                    <td><AclAccessCheckbox accessModes={(resourcePublicAccess || defaultPublicAccess)!} mode='write'
                                           onChange={props.onChangePublic}/></td>
                    <td><AclAccessCheckbox accessModes={(resourcePublicAccess || defaultPublicAccess)!} mode='control'
                                           onChange={props.onChangePublic}/>
                    </td>
                </tr>
                {Object.entries(resourceAgentAccess || {}).map(([entity, rights]) =>
                    <tr>
                        <td>{entity}</td>
                        <td><AclAccessCheckbox accessModes={rights} mode='read'
                                               onChange={(modes) => props.onChange(entity, modes)}/></td>
                        <td><AclAccessCheckbox accessModes={rights}
                                               mode='append' onChange={(modes) => props.onChange(entity, modes)}/></td>
                        <td><AclAccessCheckbox accessModes={rights} mode='write'
                                               onChange={(modes) => props.onChange(entity, modes)}/></td>
                        <td><AclAccessCheckbox accessModes={rights}
                                               mode='control' onChange={(modes) => props.onChange(entity, modes)}/></td>
                    </tr>)}
                <tr>
                    <td>Inherited</td>
                </tr>
                {Object.entries(defaultAgentAccess || {}).map(([entity, rights]) =>
                    <tr>
                        <td>{entity}</td>
                        <td><AclAccessCheckbox accessModes={rights} mode='read'/></td>
                        <td><AclAccessCheckbox accessModes={rights}
                                               mode='append'/></td>
                        <td><AclAccessCheckbox accessModes={rights} mode='write'/></td>
                        <td><AclAccessCheckbox accessModes={rights}
                                               mode='control'/></td>
                    </tr>)}
                </tbody>
            </table>

        </div>
    );
};