import {
    AccessModes,
    WithServerResourceInfo,
    acp_ess_2, WithAcp, WithAccessibleAcr, asUrl, ThingPersisted, saveSolidDatasetAt, getSourceUrl
} from "@inrupt/solid-client";
import * as React from "react";
import {useCallback} from "react";
import {usePromiseFn} from "@hilats/react-utils";
import {Checkbox} from "@mui/material";
import {ResourcePolicy} from "@inrupt/solid-client/dist/acp/policy";
import {ResourceMatcher} from "@inrupt/solid-client/dist/acp/matcher";
import {PolicyAllowModes} from "@hilats/solid-utils/dist/cjs/acp";



export function useAcrAccess(resUri: string, fetchFn: typeof fetch = fetch) {
    const resInfo$ = usePromiseFn(async () => {
        // 1. Fetch the SolidDataset with its Access Control Resource (ACR).
        const resInfo = await acp_ess_2.getResourceInfoWithAcr(
            resUri,
            { fetch: fetchFn }            // fetch from the authenticated session
        );

        /* This is done within getResourceInfoWithAcr
        const acrUrl = acp_ess_2.getLinkedAcrUrl(resInfo);

        // 2a. Get the Access Control Resource (ACR)
        const acrDataset = acrUrl && await getSolidDataset(acrUrl,
            { fetch: fetchFn }
        );

         */

        return resInfo
    }, [resUri, fetchFn])

    const setAcr = useCallback(async (acr: WithAccessibleAcr['internal_acp']['acr']) => {
        await saveSolidDatasetAt(getSourceUrl(acr), acr, {fetch: fetchFn});
        resInfo$.fetch();
    }, [resInfo$]);

    const setPublic = useCallback((access: AccessModes) => {
        /* TODO
        const res = resInfo$.fetch()
        setPublicResourceAccess(aclDataset, access);
        saveAclFor();
        universalAccess
            .setPublicAccess(resUri, accessModes, {fetch: fetchFn})
            .then(res => {
                access$.fetch();
                return res;
            })

         */
    }, [resInfo$]);

    const setAccessModes = useCallback((webId: string, accessModes: Partial<AccessModes>) => {
        /* TODO
        universalAccess
            .setAgentAccess(resUri, webId, accessModes, {fetch: fetchFn})
            .then(res => {
                access$.fetch();
                return res;
            })
        */
    }, [resInfo$]);

    return {
        resInfo$,
        setPublic,
        setAccessModes,
        setAcr
    };
}

export const AcrAccessCheckbox = (props: {
    mode: keyof PolicyAllowModes,
    accessModes: PolicyAllowModes,
    onChange?: (access: PolicyAllowModes) => void
}) => {
    return <Checkbox checked={props.accessModes[props.mode]} disabled={!props.onChange}
                     onChange={(event, checked) => props.onChange!({
                         ...props.accessModes,
                         [props.mode]: checked
                     })}/>
}
export const AcrAccessForm = (props: {
    resInfo: WithAcp & WithServerResourceInfo,
    onChange: (acr: WithAccessibleAcr['internal_acp']['acr']) => void
}) => {

    const {resInfo} = props;
    const hasAcr = acp_ess_2.hasAccessibleAcr(resInfo);

    // 3a. Get all policies from the ACR to process policies.
    const policies = hasAcr ? acp_ess_2.getResourcePolicyAll(resInfo) : null;

    const member_policies = hasAcr ? acp_ess_2.getMemberPolicyUrlAll(resInfo) : null;

    //@ts-ignore
    const setMemberPolicy = useCallback( (policy: ThingPersisted) => {
        if (hasAcr) {
            const updatedAcr = acp_ess_2.addMemberPolicyUrl(
                resInfo,
                asUrl(policy),
            );
            // Save to the dataset
            props.onChange(updatedAcr.internal_acp.acr);
        }
    }, [resInfo])


    // 4a. Get all matchers from the ACR to process matchers.
    const matchers = hasAcr ? acp_ess_2.getResourceMatcherAll(resInfo) : null;

    return (
        <div>
            <h4>ACP</h4>
            <h5>Policies</h5>
            <table className="acrPolicies">
                <tbody>
                <tr>
                    <th>name</th>
                    <th>R</th>
                    <th>W</th>
                    <th>A</th>
                    <th>Inh</th>
                </tr>
                {policies?.map((policy: ResourcePolicy) => <AcrPolicy key={policy.url} policy={policy}
                                                                      memberPolicies={member_policies || []}/>)}
                </tbody>
            </table>

            <h5>Matchers</h5>
            <table className="acrMatchers">
                <tbody>
                <tr>
                    <th></th>
                    <th>Pub</th>
                    <th>Cre</th>
                    <th>Auth</th>
                </tr>
                {matchers?.map((matcher: ResourceMatcher) => <AcrMatcher matcher={matcher} key={matcher.url}/>)}
                </tbody></table>

        </div>
);
};


export function AcrPolicy({
    policy, memberPolicies
}: {
    policy: ResourcePolicy, memberPolicies
:
    string[]
}) {
    const allMatchers = acp_ess_2.getAllOfMatcherUrlAll(policy);
    const anyMatchers = acp_ess_2.getAnyOfMatcherUrlAll(policy);
    const noneMatchers = acp_ess_2.getNoneOfMatcherUrlAll(policy);
    const modes = acp_ess_2.getAllowModes(policy);

    return <>
        <tr>
            <td title={policy.url} className="policyName">{new URL(policy.url).hash}</td>
            <td><AcrAccessCheckbox accessModes={modes} mode="read"/></td>
            <td><AcrAccessCheckbox accessModes={modes} mode="append"/></td>
            <td><AcrAccessCheckbox accessModes={modes} mode="write"/></td>
            <td>{memberPolicies.indexOf(policy.url) >= 0 ? '✓' : null}</td>
        </tr>
        <tr>
            <td colSpan={5} className="policyMatchers">
                {allMatchers.length ? <div>All of {allMatchers.map(m => <div title={m} className="matcherName" key={m}>{new URL(m).hash}</div>)}</div> : null}
                {anyMatchers.length ? <div>Any of {anyMatchers.map(m => <div title={m} key={m}
                    className="matcherName">{new URL(m).hash}</div>)}</div> : null}
                {noneMatchers.length ? <div>None of {noneMatchers.map(m => <div title={m} key={m}
                    className="matcherName">{new URL(m).hash}</div>)}</div> : null}

            </td>
        </tr>
    </>;
}

export function AcrMatcher({matcher}: { matcher: ResourceMatcher }) {
    const name = matcher.url;
    const agentMatchers = acp_ess_2.getAgentAll(matcher);
    const hasPublic = acp_ess_2.hasPublic(matcher);
    const hasCreator = acp_ess_2.hasCreator(matcher);
    const hasAuthenticated = acp_ess_2.hasAuthenticated(matcher);
    return <><tr>
        <td className="matcherName" title={name}>{name}</td>
        <td>{hasPublic ? '✓' : ''}</td>
        <td>{hasCreator ? '✓' : ''}</td>
        <td>{hasAuthenticated ? '✓' : ''}</td>
    </tr>
        {agentMatchers.map(a =>
                <tr>
                    <td colSpan={4}>{a}</td>
                </tr>
            )}
    </>
}