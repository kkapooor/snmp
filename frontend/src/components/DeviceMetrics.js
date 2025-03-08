import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Button,
  Box,
  Chip,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatDistanceToNow } from 'date-fns';

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, index)).toFixed(2)} ${sizes[index]}`;
};

const DeviceMetrics = () => {
  const { deviceId } = useParams();
  const [device, setDevice] = useState(null);
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch device details
        const deviceResponse = await fetch(`/api/devices/${deviceId}`);
        const deviceData = await deviceResponse.json();
        setDevice(deviceData);

        // Fetch metrics history
        const metricsResponse = await fetch(`/api/devices/${deviceId}/metrics`);
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData);
        setLoading(false);
      } catch (err) {
        setError('Error fetching device metrics');
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [deviceId]);

  const startMonitoring = async () => {
    try {
      await fetch(`/api/devices/${deviceId}/monitor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      // Refresh data after starting monitoring
      window.location.reload();
    } catch (err) {
      setError('Error starting device monitoring');
    }
  };

  const stopMonitoring = async () => {
    try {
      await fetch(`/api/devices/${deviceId}/stop-monitor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      // Refresh data after stopping monitoring
      window.location.reload();
    } catch (err) {
      setError('Error stopping device monitoring');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div>
      <Box mb={3}>
        <Typography variant="h4" gutterBottom>
          Device Metrics: {device?.hostname}
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          IP Address: {device?.ipAddress}
        </Typography>
        <Box mt={2}>
          <Button
            variant="contained"
            color="primary"
            onClick={startMonitoring}
            style={{ marginRight: '10px' }}
          >
            Start Monitoring
          </Button>
          <Button variant="contained" color="secondary" onClick={stopMonitoring}>
            Stop Monitoring
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Current Status Card */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current Status
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="textSecondary">
                    Status
                  </Typography>
                  <Typography variant="body1">
                    {device?.status?.toUpperCase()}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="textSecondary">
                    Last Seen
                  </Typography>
                  <Typography variant="body1">
                    {device?.lastSeen ? formatDistanceToNow(new Date(device.lastSeen), { addSuffix: true }) : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="textSecondary">
                    Reachability
                  </Typography>
                  <Typography variant="body1">
                    {device?.reachabilityStatus?.toUpperCase()}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Metrics Chart */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Metrics
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={formatDate}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={formatDate}
                    formatter={(value) => value.toFixed(2)}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="cpuUtilization"
                    name="CPU (%)"
                    stroke="#8884d8"
                  />
                  <Line
                    type="monotone"
                    dataKey="memoryUtilization"
                    name="Memory (%)"
                    stroke="#82ca9d"
                  />
                  <Line
                    type="monotone"
                    dataKey="temperature"
                    name="Temperature (°C)"
                    stroke="#ffc658"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Interface Information */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Interface Information
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>MAC Address</TableCell>
                      <TableCell>IP Addresses</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Speed</TableCell>
                      <TableCell>MTU</TableCell>
                      <TableCell>Traffic In/Out</TableCell>
                      <TableCell>Errors In/Out</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {device?.interfaces?.map((iface) => (
                      <TableRow key={iface.id}>
                        <TableCell>
                          {iface.name || iface.description || `Interface ${iface.interfaceIndex}`}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" style={{ fontFamily: 'monospace' }}>
                            {iface.macAddress || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {iface.ipAddresses?.map((ip, idx) => (
                            <div key={idx}>
                              <Typography variant="body2" style={{ fontFamily: 'monospace' }}>
                                {ip.address}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                Subnet: {ip.subnetMask}
                              </Typography>
                            </div>
                          )) || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={iface.operStatus?.toUpperCase()}
                            color={iface.operStatus === 'up' ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {iface.speed ? `${(iface.speed / 1000000).toFixed(0)} Mbps` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {iface.mtu || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            In: {formatBytes(iface.inOctets)}
                          </Typography>
                          <Typography variant="body2">
                            Out: {formatBytes(iface.outOctets)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color={iface.inErrors > 0 ? 'error' : 'textPrimary'}>
                            In: {iface.inErrors}
                          </Typography>
                          <Typography variant="body2" color={iface.outErrors > 0 ? 'error' : 'textPrimary'}>
                            Out: {iface.outErrors}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Metrics History Table */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Metrics History
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>CPU (%)</TableCell>
                      <TableCell>Memory (%)</TableCell>
                      <TableCell>Temperature (°C)</TableCell>
                      <TableCell>Free Memory (MB)</TableCell>
                      <TableCell>Total Memory (MB)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {metrics.map((metric) => (
                      <TableRow key={metric.id}>
                        <TableCell>{formatDate(metric.timestamp)}</TableCell>
                        <TableCell>{metric.cpuUtilization?.toFixed(2)}</TableCell>
                        <TableCell>{metric.memoryUtilization?.toFixed(2)}</TableCell>
                        <TableCell>{metric.temperature?.toFixed(2)}</TableCell>
                        <TableCell>{(metric.freeMemory / 1024 / 1024).toFixed(2)}</TableCell>
                        <TableCell>{(metric.totalMemory / 1024 / 1024).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
};

export default DeviceMetrics;
