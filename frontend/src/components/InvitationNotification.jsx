import React, { useEffect, useState } from 'react';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export default ({accept, reject, countdownTime}) => { 
  const [countdown, setCountdown] = useState(countdownTime);
  useEffect(() => {
    const decreasedCountdown = countdown - 1;
    if(decreasedCountdown > -1) {
      setTimeout(() => {
        setCountdown(decreasedCountdown);
      }, 1000);
    }
  });
  return <>
    <Box 
     marginY={'3%'}
     justifyContent='center'
     sx={{ 
      width: '100%',
      display: 'flex',
      flexWrap: 'wrap',
      '& > :not(style)': {
        m: 1,
        width: 400,
        height: 128,
      } 
     }}>
      <Paper elevation={10}>
        <Box textAlign='center' marginY={'8%'}>
          <Typography variant="h5" color="primary">Event Invitation Expire In</Typography>
          <Typography variant="h6" color="primary">{countdown} Seccond</Typography>
        </Box>
      </Paper>
    </Box>
    <Box
      gap={2}
      justifyContent='center'
      sx={{
        display: 'flex',
        alignItems: 'center',
        '& > *': {
          m: 5,
        },
      }}
    >
      {countdown > 0 &&
        <Button onClick={accept} variant="outlined" color={'primary'}>Join Now</Button>
      }
      <Button onClick={reject} variant="outlined" color={'secondary'}>Reset Ticket</Button>
    </Box>
  </>
}