import {useNavigate} from "react-router";
import {useMemo} from "react";
import {To, useSearchParams} from "react-router-dom";
import type {NavigateOptions} from "react-router/dist/lib/context";

export function usePersistentQueryNavigate() {

    const navigate = useNavigate();
    const [query] = useSearchParams();

    return useMemo(() => (to: To, options?: NavigateOptions) => navigate(typeof to == 'string' ? {pathname: to, search: query.toString()} : {...to, search: query.toString()}, options), [navigate]);

}