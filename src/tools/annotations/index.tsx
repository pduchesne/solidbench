import * as React from "react";
import {useParams, useSearchParams} from "react-router-dom";
import {useFixedSolidSession} from "../../solid/SessionProvider";
import {useContext, useMemo} from "react";
import {AppContext} from "../../appContext";
import {MemoryAnnotationStorage, PodAnnotationStorage } from "./storage";

export const AnnotationsDashboard = () => {

    //const {search} = useLocation();

    return <div className="annotations">
        {/* Until there's a need for multiple tabs, just display the main panel always
        <Routes>
            <Route path="/:panelId/*" element={<AnnotationsDisplay/>}/>
            <Route path="*" element={<Navigate to={"overview" + decodeURIComponent(search)} replace={true}/>}/>
        </Routes>
        */}
        <AnnotationsDisplay />
    </div>
}

export const AnnotationsDisplay = () => {

    const {fetch} = useFixedSolidSession();
    const appContext = useContext(AppContext);

    const podStorage = useMemo(
        () => appContext.podUrl ? new PodAnnotationStorage(appContext.podUrl, {fetch}) : undefined,
        [appContext.podUrl, fetch]);

    const [params] = useSearchParams();
    const externalInputs = params.getAll('input');

    const memoryStorage = useMemo(
        () => externalInputs?.length ? new MemoryAnnotationStorage({uris: externalInputs}) : undefined,
        // must concat array to have a constant value across renderings
        [externalInputs.join(',')]);

//const preferences$ = useMemo(() => podStorage?.fetchPreferences(), [podStorage]);

    const annotationStorage = memoryStorage || podStorage;

    const navigate = usePersistentQueryNavigate();

    return <>
        TODO
       </>
}




export default AnnotationsDashboard;