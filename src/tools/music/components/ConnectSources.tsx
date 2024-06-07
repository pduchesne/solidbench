import * as React from "react";
import {useParams} from "react-router-dom";
import {useNavigate} from "react-router";
import {FC} from "react";
import {SpotifyCard, SpotifyProvider} from "../spotify";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export type MusicDataImporter<T = {}> = FC<T & {onClose: () => void}>;

export type ProviderCard<T> = FC<{ onAction:(props: T) => void}>;

export type MusicDataProvider<T = {}> = { label: string, card: ProviderCard<T>, importer: MusicDataImporter<T> };

/**
 * Import UI components for specific retailers
 */
const MUSICDATAPROVIDERS: Record<string, MusicDataProvider> = {
    spotify: SpotifyProvider,
    lastfm: SpotifyProvider
}

export const ImporterCards = () => {
    return <div className="hFlow dataproviders">
        {Object.entries(MUSICDATAPROVIDERS).map(([retailer, config]) => {
            return <div className="providerCard">
                {config.label}
                <config.card onAction={() => {
                }}/>
            </div>
        })}
    </div>
}


export const MusicImporter = () => {

    const {source} = useParams();
    const navigate = useNavigate();

    const Importer = MUSICDATAPROVIDERS[source!].importer;

    return <div>CLOSE<Importer onClose={() => navigate('.', {replace: false})}/></div>
}

export const ConnectSources = (props: {}) => {
    const [expanded, setExpanded] = React.useState<string>();

    const handleSectionChange = (value?: string) => setExpanded(value == expanded ? undefined : value);

    return <div>
        <Accordion expanded={expanded === 'spotify'} onChange={() => handleSectionChange('spotify')}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>Spotify</AccordionSummary>
            <AccordionDetails>
                <SpotifyCard/>
            </AccordionDetails>
        </Accordion>
    </div>
}

export default ConnectSources;