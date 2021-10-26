import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

export const Stock = ({stocks}) => {
  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 700 }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell align="center">
              <Typography variant="h6">Phone Model</Typography>
            </TableCell>
            <TableCell align="center">
              <Typography variant="h6">Available Stock</Typography>
            </TableCell>
            <TableCell align="center">
              <Typography variant="h6">Pre-Order Price</Typography>
            </TableCell>
            <TableCell align="center">
              <Typography variant="h6">Retail Price</Typography>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {stocks.map((stock) => (
            <TableRow
              key={stock.name}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell align="center">{stock.name}</TableCell>
              <TableCell align="center">{stock.remainingStock}</TableCell>
              <TableCell align="center">RM {stock.promoPrice}</TableCell>
              <TableCell align="center">RM {stock.rrp}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}