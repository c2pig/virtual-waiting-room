import React, { useEffect, useState } from "react"
import Layout from "../components/Layout"
import { Stock } from '../components/Stock';
import Box from '@mui/material/Box';
import InvitationNotification from '../components/InvitationNotification';
import EstimationBanner from '../components/EstimationBanner';

const getEstimatedTime = ({numberOfAhead, estimatedEarlyTimeMinute, estimatedLateTimeMinute}) => {
  if(!estimatedEarlyTimeMinute || !estimatedLateTimeMinute || !numberOfAhead) {
    return "N/A";
  }
  return numberOfAhead === 0 ? "0" : `${estimatedEarlyTimeMinute} mins - ${estimatedLateTimeMinute} mins`
}
const IndexPage = ({location}) => {
  const [stocks, setStocks ] = useState([]);
  const [stats, setStats ] = useState([]);
  const [invitationAlert, setInvitationAlert] = useState(false);
  const [countdownTime, setCountdownTime] = useState(0);
  const refreshInterval = 10 * 1000;


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
    if(!invited) {
      setTimeout(() => {
        window.location.reload();
      }, refreshInterval);
    } else {
      setCountdownTime(Math.floor(invitationTimeout / 1000));
      setInvitationAlert(invited);
    }
  }, [])

  const {
    lastServedTicketNumber,
    ticketNumber,
  } = stats;
  console.log(stats);
  const estimatedTime = getEstimatedTime({...stats});
  return (
    <Layout>
      <Stock stocks={stocks} />
      { 
      invitationAlert ? 
        <InvitationNotification
          accept={() => {
            console.log('accept');
            window.location.replace("http://iphone.celcom.com.my/");
          }}
          reject={async() => { 
            console.log('reject');
            await fetch("http://iphone.celcom.com.my/v1/invitations", {
              method: 'DELETE',
              credentials: 'include',
            }).then(() => {
              window.location.replace("http://iphone.celcom.com.my/");
            });
          }}
          countdownTime={countdownTime}
        />
        : 
        <Box marginTop={'10%'}>
          <EstimationBanner
            estimatedTime={estimatedTime}
            value={ticketNumber - (lastServedTicketNumber+100)}
            servingNumber={lastServedTicketNumber}
            ticketNumber={ticketNumber}
          />
        </Box>
      }
    </Layout>
  )
}

export default IndexPage
