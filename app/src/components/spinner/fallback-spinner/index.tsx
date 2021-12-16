import { makeStyles } from '@mui/styles';

const useStyles = makeStyles({
    spinner: {
        display: 'inline-block',
        position: 'relative',
        width: '80px',
        height: '80px',
        '& div': {
            position: 'absolute',
            border: '4px solid #00ffd0',
            opacity: 1,
            borderRadius: '50%',
            animation: '$fallbackSpinner 1s cubic-bezier(0, 0.2, 0.8, 1) infinite'
        },
        '& div:nth-child(2)': {
            animationDelay: '-0.5s'
        }
    },
    '@keyframes fallbackSpinner': {
        '0%': {
            top: '36px',
            left: '36px',
            width: 0,
            height: 0,
            opacity: 1
        },
        '100%': {
            top: 0,
            left: 0,
            width: '72px',
            height: '72px',
            opacity: 0
        }
    }
})

const FallbackSpinner = () => {
    const classes = useStyles();

    return (
        <div className={classes.spinner}>
            <div></div>
            <div></div>
        </div>
    )
}

export default FallbackSpinner