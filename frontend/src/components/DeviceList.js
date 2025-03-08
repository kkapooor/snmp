import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Button,
  IconButton,
  Chip
} from '@mui/material';
import { Visibility } from '@mui/icons-material';

function DeviceList() {
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/devices`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setDevices(data);
        }
      } catch (error) {
        console.error('Error fetching devices:', error);
      }
    };

    fetchDevices();
  }, []);

  return (
    <Container maxWidth="lg" style={{ marginTop: '2rem' }}>
      <Typography variant="h4" gutterBottom>
        Devices
      </Typography>

      <Button
        variant="contained"
        color="primary"
        style={{ marginBottom: '1rem' }}
        onClick={() => {/* Add new device handler */}}
      >
        Add Device
      </Button>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>IP Address</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Last Checked</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {devices.map((device) => (
              <TableRow key={device.id}>
                <TableCell>{device.name}</TableCell>
                <TableCell>{device.ipAddress}</TableCell>
                <TableCell>
                  <Chip
                    label={device.status}
                    color={device.status === 'up' ? 'success' : 'error'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {device.lastChecked ? new Date(device.lastChecked).toLocaleString() : 'Never'}
                </TableCell>
                <TableCell>
                  <IconButton
                    component={Link}
                    to={`/devices/${device.id}/metrics`}
                    color="primary"
                  >
                    <Visibility />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}

export default DeviceList;
