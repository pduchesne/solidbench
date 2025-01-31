import * as React from "react";
import FolderSharedIcon from '@mui/icons-material/FolderShared';
import SettingsIcon from '@mui/icons-material/Settings';
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";
import { useNavigate } from "react-router";
import InfoIcon from '@mui/icons-material/Info';
import { AppDescriptor } from "@hilats/data-modules";

export const Sidenav = (props: {selected: string, selectPanel: (id: string) => void, customPanels: Record<string, AppDescriptor>}) => {

    const navigate = useNavigate();

    return <div className="sidenav">
        <NavButton label="Pod Browser" icon={FolderSharedIcon} id='podbrowser' {...props}/>
        <Divider className='sidenav-divider'/>
        {Object.entries(props.customPanels).map(([panelId, appDescr]) =>
            <NavButton key={appDescr.id} label={appDescr.label} icon={appDescr.icon} id={panelId} {...props}/>
        )}
        <Divider className='sidenav-divider'/>
        <NavButton label="Settings" icon={SettingsIcon} id='settings' {...props}/>
        <IconButton title="About" onClick={() => navigate("/podbrowser/welcome")}><InfoIcon /></IconButton>
    </div>
}

export const NavButton = (props: {label: string, selected: string, selectPanel: (id: string) => void, icon: any, id: string}) => {
    return <IconButton title={props.label} aria-selected={props.selected == props.id} onClick={() => props.selectPanel(props.id)}><props.icon/></IconButton>
}