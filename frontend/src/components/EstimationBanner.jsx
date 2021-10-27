import * as React from 'react';
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';

export default ({estimatedTime, value, servingNumber, ticketNumber}) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
      <Box sx={{ 
        width: '100%',
        display: 'flex',
        flexWrap: 'wrap',
        '& > :not(style)': {
          m: 1,
          width: 280,
          height: 128,
        } 
      }}>
        <Paper elevation={3}>
          <Box textAlign='center' marginY={'10%'}>
            <Typography variant="h5" color="primary">Estimated Time</Typography>
            <Typography variant="h6" color="text.primary">{estimatedTime}</Typography>
          </Box>
        </Paper>
        <Paper elevation={3}>
          <Box textAlign='center' marginY={'10%'}>
            <Typography variant="h5" color="primary">Ticket Number</Typography>
            <Typography variant="h6" color="text.primary">#{ticketNumber}</Typography>
          </Box>
        </Paper>
        <Paper elevation={3}>
          <Box textAlign='center' marginY={'10%'}>
            <Typography variant="h5" color="primary">Serving Number</Typography>
            <Typography variant="h6" color="text.primary">#{servingNumber}</Typography>
          </Box>
        </Paper>
      </Box>
      <Box sx={{ width: '100%', mr: 1 }} marginY={'2%'}>
        <LinearProgress style={{height: '20px' }} variant="determinate" value={value} valueBuffer={100-value}/>
      </Box>
    </Box>
  );
}