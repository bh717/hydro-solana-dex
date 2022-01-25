import { FC } from 'react';
import { makeStyles } from '@mui/styles';
import { Dialog, Box, IconButton } from '@mui/material';
import DialogContent from '@mui/material/DialogContent';

import { Close } from '../icons';

const useStyles = makeStyles({
    dialog: {
        '& .MuiDialog-container': {
            alignItems: 'flex-start'
        },
        '& .MuiDialog-paper': {
            background: 'linear-gradient(180deg, rgba(41, 255, 200, 0.25) 0%, rgba(1, 207, 237, 0) 100%)',
            borderRadius: '6px',
            position: 'relative',
            padding: '1px',
            marginTop: '84px',
            marginBottom: '84px',
            width: '420px',
            maxHeight: 'calc(100% - 168px)',
            '@media (max-width:600px)': {
                width: '100%',
                margin: '80px 15px'
            }
        }
    },
    contentWrapper: {
        background: '#313C4E',
        borderRadius: '6px',
        position: 'relative',
        height: '100%',
        overflowY: 'auto'
    },
    closeButton: {
        padding: '0 !important',
        position: 'absolute !important' as any,
        top: '29px',
        right: '24px',
        '& svg': {
            color: '#FFFFFF73',
            width: '14px',
            height: '14px'
        }
    },
    dialogContent: {
        padding: '0px !important'
    }
})

interface ModalProps {
    content: JSX.Element;
    open: boolean;
    onClose(): void;
}

const Modal: FC<ModalProps> = ({ content, open, onClose }) => {
    const classes = useStyles();

    return (
        <Dialog className={classes.dialog} open={open}>
            <Box className={classes.contentWrapper}>
                <IconButton className={classes.closeButton} aria-label="close" onClick={onClose}>
                    <Close />
                </IconButton>
                <DialogContent className={classes.dialogContent}>
                    {content}
                </DialogContent>
            </Box>
        </Dialog>
    )
}

export default Modal;