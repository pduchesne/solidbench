
import { APP_REGISTRY } from "@hilats/data-modules";

import LocalGroceryStoreIcon from '@mui/icons-material/LocalGroceryStore';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssistantIcon from '@mui/icons-material/Assistant';

APP_REGISTRY.registerModule({
    id: 'retail',
    label: 'Retail Dashboard',
    icon: LocalGroceryStoreIcon,
    loadApp: () => import('@hilats/solid-app-retail').then(m => m.default)
})

/*
APP_REGISTRY.registerModule({
    id: 'annotations',
    label: 'Annotation Dashboard',
    icon: CommentIcon,
    loadApp: () => import('../annotations').then(m => m.default)
})

 */

APP_REGISTRY.registerModule( {
    id: 'music',
    label: 'Music Dashboard',
    icon: LibraryMusicIcon,
    loadApp: () => import('@hilats/solid-app-music').then(m => m.default)
})

APP_REGISTRY.registerModule({
    id: 'assistant',
    label: 'AI Assistant',
    icon: AssistantIcon,
    loadApp: () => import('@hilats/solid-app-assistant').then(m => m.default)
})

APP_REGISTRY.registerModule({
    id: 'template',
    label: 'Template Dashboard',
    icon: DashboardIcon,
    loadApp: () => import('@hilats/solid-app-template').then(m => m.default)
})