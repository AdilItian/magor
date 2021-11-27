import React from 'react'
import { Layout, AppBar as DefaultAppBar } from 'react-admin'
import Button from '@material-ui/core/Button'
import Typography from '@material-ui/core/Typography'

const MyAppBar = (props) => {
    return (
        <DefaultAppBar {...props}>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    flex: '1',
                }}
            >
                <Typography variant="h6" id="react-admin-title" />
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => window.open('/', '_self')}
                >
                    Back to Magor
                </Button>
            </div>
        </DefaultAppBar>
    )
}

const MyLayout = (props) => <Layout {...props} appBar={MyAppBar} />

export default MyLayout
