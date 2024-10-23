import * as React from "react";
import LocalGroceryStoreIcon from '@mui/icons-material/LocalGroceryStore';
import FolderSharedIcon from '@mui/icons-material/FolderShared';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import MovieIcon from '@mui/icons-material/Movie';
import SettingsIcon from '@mui/icons-material/Settings';
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";
import CommentIcon from '@mui/icons-material/Comment';
import {PANEL_ID} from "./index";
import { useNavigate } from "react-router";
import InfoIcon from '@mui/icons-material/Info';

export const Sidenav = (props: {selected: PANEL_ID, selectPanel: (id: PANEL_ID) => void}) => {

    const navigate = useNavigate();

    return <div className="sidenav">
        <NavButton label="Pod Browser" icon={FolderSharedIcon} id='podbrowser' {...props}/>
        <Divider className='sidenav-divider'/>
        <NavButton label="Retail" icon={LocalGroceryStoreIcon} id='retail' {...props}/>
        <NavButton label="Annotations" icon={CommentIcon} id='annotations' {...props}/>
        <NavButton label="Music" icon={LibraryMusicIcon} id='music' {...props}/>
        <NavButton label="Movies" icon={MovieIcon} id='movies' {...props}/>
        <NavButton label="Health" icon={MonitorHeartIcon} id='health' {...props}/>
        <Divider className='sidenav-divider'/>
        <NavButton label="Settings" icon={SettingsIcon} id='settings' {...props}/>
        <IconButton title="About" onClick={() => navigate("/")}><InfoIcon /></IconButton>
    </div>
}

export const NavButton = (props: {label: string, selected: PANEL_ID, selectPanel: (id: PANEL_ID) => void, icon: any, id: PANEL_ID}) => {
    return <IconButton title={props.label} aria-selected={props.selected == props.id} onClick={() => props.selectPanel(props.id)}><props.icon/></IconButton>
}