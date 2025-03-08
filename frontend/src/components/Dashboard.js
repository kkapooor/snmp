import React, { useState, useEffect } from 'react';
import { Container, Grid, Paper, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

function Dashboard() {
  const [summary, setSummary] = useState({
    totalDevices: 0,
    activeDevices: 0,
    inactiveDevices: 0
  });

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/devices/summary`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setSummary(data);
        }
      } catch (error) {
        console.error('Error fetching summary:', error);
      }
    };

    fetchSummary();
  }, []);

  return (
    <Container maxWidth="lg" style={{ marginTop: '2rem' }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} style={{ padding: '1rem', textAlign: 'center' }}>
            <Typography variant="h6">Total Devices</Typography>
            <Typography variant="h3">{summary.totalDevices}</Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper elevation={3} style={{ padding: '1rem', textAlign: 'center' }}>
            <Typography variant="h6">Active Devices</Typography>
            <Typography variant="h3" style={{ color: 'green' }}>
              {summary.activeDevices}
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper elevation={3} style={{ padding: '1rem', textAlign: 'center' }}>
            <Typography variant="h6">Inactive Devices</Typography>
            <Typography variant="h3" style={{ color: 'red' }}>
              {summary.inactiveDevices}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Typography variant="h5" style={{ marginTop: '2rem', marginBottom: '1rem' }}>
        Quick Links
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={3} 
            style={{ padding: '1rem' }}
            component={Link}
            to="/devices"
            sx={{
              textDecoration: 'none',
              color: 'inherit',
              '&:hover': {
                backgroundColor: '#f5f5f5'
              }
            }}
          >
            <Typography variant="h6">Manage Devices</Typography>
            <Typography variant="body2" color="textSecondary">
              View and manage all network devices
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default Dashboard;
