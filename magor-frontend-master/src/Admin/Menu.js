// in src/Menu.js
import * as React from 'react'
import { useSelector } from 'react-redux'
import { MenuItemLink, getResources } from 'react-admin'
import { withRouter } from 'react-router-dom'
import AssessmentIcon from '@material-ui/icons/Assessment'
import DescriptionIcon from '@material-ui/icons/Description'

const Menu = ({ onMenuClick }) => {
    const open = useSelector((state) => state.admin.ui.sidebarOpen)
    const resources = useSelector(getResources)
    return (
        <div>
            {resources.map((resource) => (
                <MenuItemLink
                    key={resource.name}
                    to={`/${resource.name}`}
                    primaryText={
                        (resource.options && resource.options.label) ||
                        resource.name
                    }
                    leftIcon={<DescriptionIcon />}
                    onClick={onMenuClick}
                    sidebarIsOpen={open}
                />
            ))}
            <MenuItemLink
                to="/statistics"
                primaryText="Statistics"
                leftIcon={<AssessmentIcon />}
                onClick={onMenuClick}
                sidebarIsOpen={open}
            />
        </div>
    )
}

export default withRouter(Menu)
