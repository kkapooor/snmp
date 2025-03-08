import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Box,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Timeline as TimelineIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

const Devices = () => {
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDevices = async () => {
    try {
      const response = await fetch('/api/devices');
      if (!response.ok) {
        throw new Error('Failed to fetch devices');
      }
      const data = await response.json();
      setDevices(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
    // Refresh device list every minute
    const interval = setInterval(fetchDevices, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this device?')) {
      try {
        const response = await fetch(`/api/devices/${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error('Failed to delete device');
        }
        fetchDevices();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleMonitoringToggle = async (id, currentlyMonitoring) => {
    try {
      const endpoint = currentlyMonitoring ? 'stop-monitor' : 'monitor';
      const response = await fetch(`/api/devices/${id}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to ${currentlyMonitoring ? 'stop' : 'start'} monitoring`);
      }
      fetchDevices();
    } catch (err) {
      setError(err.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'up':
        return 'success';
      case 'down':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Container maxWidth="xl">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Devices</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/devices/new')}
        >
          Add Device
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Hostname</TableCell>
              <TableCell>IP Address</TableCell>
              <TableCell>Device Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Last Seen</TableCell>
              <TableCell>Monitoring</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {devices.map((device) => (
              <TableRow key={device.id}>
                <TableCell>{device.hostname}</TableCell>
                <TableCell>{device.ipAddress}</TableCell>
                <TableCell>{device.deviceType}</TableCell>
                <TableCell>
                  <Chip
                    label={device.status?.toUpperCase()}
                    color={getStatusColor(device.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {device.lastSeen
                    ? formatDistanceToNow(new Date(device.lastSeen), { addSuffix: true })
                    : 'Never'}
                </TableCell>
                <TableCell>
                  <Tooltip title={device.monitoring ? 'Stop Monitoring' : 'Start Monitoring'}>
                    <IconButton
                      onClick={() => handleMonitoringToggle(device.id, device.monitoring)}
                      color={device.monitoring ? 'secondary' : 'primary'}
                    >
                      {device.monitoring ? <StopIcon /> : <PlayIcon />}
                    </IconButton>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Tooltip title="View Metrics">
                    <IconButton
                      onClick={() => navigate(`/devices/${device.id}/metrics`)}
                      color="primary"
                    >
                      <TimelineIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit">
                    <IconButton
                      onClick={() => navigate(`/devices/${device.id}/edit`)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      onClick={() => handleDelete(device.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default Devices;
