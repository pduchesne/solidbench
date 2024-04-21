import * as React from "react";
import LocalGroceryStoreIcon from '@mui/icons-material/LocalGroceryStore';
import FolderSharedIcon from '@mui/icons-material/FolderShared';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import MovieIcon from '@mui/icons-material/Movie';
import SettingsIcon from '@mui/icons-material/Settings';
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";

export const Sidenav = (props: {selected: string, selectPanel: (id: string) => void}) => {

    return <div className="sidenav">
        <NavButton icon={FolderSharedIcon} id='podbrowser' {...props}/>
        <Divider className='sidenav-divider'/>
        <NavButton icon={LocalGroceryStoreIcon} id='retail' {...props}/>
        <NavButton icon={LibraryMusicIcon} id='music' {...props}/>
        <NavButton icon={MovieIcon} id='movies' {...props}/>
        <NavButton icon={MonitorHeartIcon} id='health' {...props}/>
        <Divider className='sidenav-divider'/>
        <NavButton icon={SettingsIcon} id='settings' {...props}/>
    </div>
}

export const NavButton = (props: {selected: string, selectPanel: (id: string) => void, icon: any, id: string}) => {
    return <IconButton aria-selected={props.selected == props.id} onClick={() => props.selectPanel(props.id)}><props.icon/></IconButton>
}