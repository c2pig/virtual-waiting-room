import React, { useEffect, useState } from "react"
import Layout from "../components/layout"
import { Stock } from '../components/stock';
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';

const EstimatedArrivalStatus = ({estimatedTime, value, servingNumber, ticketNumber}) => {
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

const IndexPage = ({location}) => {
  const [stocks, setStocks ] = useState([]);
  const [stats, setStats ] = useState([]);
  const refreshInterval = 5 * 1000;
  useEffect(async() => {
    const stockReq = await fetch("http://iphone.celcom.com.my/v1/stocks", {
      credentials: 'include'
    });
    const invitationReq =  await fetch("http://iphone.celcom.com.my/v1/invitations", {
      credentials: 'include',
    });
    const statsReq =  await fetch("http://iphone.celcom.com.my/v1/stats", {
      credentials: 'include',
    });
    const stockData = await stockReq.json();
    setStocks(stockData.data); 
    setStats(await statsReq.json())
    const { invited = false, invitationTimeout } = await invitationReq.json();
    if(invited) {
      if( window.confirm(`Your invitation to iPhone pre-order will be expired in ${Math.floor(invitationTimeout/1000)} secs.  Click [OK] to join `)) {
        console.log('accept')
        window.location.replace("http://iphone.celcom.com.my/");
      } else {
        console.log('reject')
        await fetch("http://iphone.celcom.com.my/v1/rejections", {
          credentials: 'include',
        });
      }
    } else {
      setTimeout(() => {
        window.location.reload();
      }, refreshInterval);
    }
  }, [])

  console.log(stats);
  const {
    numberOfAhead,
    estimatedEarlyTimeMinute,
    estimatedLateTimeMinute,
    lastServedTicketNumber,
    ticketNumber,
  } = stats;

  const estimatedTime = numberOfAhead === 0 ? "0" : `${estimatedEarlyTimeMinute} mins - ${estimatedLateTimeMinute} mins`;
  return (
    <Layout>
      <Stock stocks={stocks} />
      <Box marginTop={'10%'}>
        <EstimatedArrivalStatus
          estimatedTime={estimatedTime}
          value={ticketNumber - (lastServedTicketNumber+100)}
          servingNumber={lastServedTicketNumber}
          ticketNumber={ticketNumber}
        />
      </Box>
    </Layout>
  )
}

export default IndexPage
