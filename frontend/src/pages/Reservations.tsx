import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container, Typography, Button, Box, Card,
  CardContent, AppBar, Toolbar, Chip, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';

interface Reservation {
  _id: string;
  bookId: { title: string; author: string; isbn: string; availableCopies: number };
  status: string;
  createdAt: string;
}

const Reservations: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState('');
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!user.id) { navigate('/login'); return; }
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/reservations/my/${user.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReservations(res.data);
    } catch (err) {
      console.log('Error fetching reservations');
    }
  };

  const handleReserveBook = async () => {
    if (!selectedBookId) return;
    try {
      const res = await axios.post(
        'http://localhost:5000/api/reservations',
        { memberId: user.id, bookId: selectedBookId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(res.data.msg);
      setOpenDialog(false);
      setSelectedBookId('');
      fetchReservations();
    } catch (err: any) {
      setError(err.response?.data?.msg || 'Reservation failed');
    }
  };

  const handleCancel = async (reservationId: string) => {
    try {
      const res = await axios.put(
        `http://localhost:5000/api/reservations/cancel/${reservationId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(res.data.msg);
      fetchReservations();
    } catch (err: any) {
      setError(err.response?.data?.msg || 'Cancellation failed');
    }
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>📋 My Reservations</Typography>
          <Button color="inherit" onClick={() => navigate('/dashboard')}>Dashboard</Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">My Reservations ({reservations.length})</Typography>
          <Button variant="contained" onClick={() => setOpenDialog(true)}>
            ➕ Reserve a Book
          </Button>
        </Box>

        {reservations.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="h6" color="textSecondary">
              No reservations yet
            </Typography>
            <Button
              variant="contained"
              sx={{ mt: 2 }}
              onClick={() => navigate('/books')}
            >
              Browse Books
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 3 }}>
            {reservations.map((res) => (
              <Card key={res._id}>
                <CardContent>
                  <Typography variant="h6">{res.bookId?.title}</Typography>
                  <Typography color="textSecondary">by {res.bookId?.author}</Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    ISBN: {res.bookId?.isbn}
                  </Typography>
                  <Typography variant="body2">
                    Reserved: {new Date(res.createdAt).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2">
                    Available Copies: {res.bookId?.availableCopies}
                  </Typography>

                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip
                      label={res.status.toUpperCase()}
                      color={res.status === 'ready' ? 'success' : 'primary'}
                      size="small"
                    />
                    {res.status !== 'cancelled' && (
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => handleCancel(res._id)}
                      >
                        Cancel
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}

        {/* Reserve Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
          <DialogTitle>Reserve a Book</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mt: 2 }}>
              Go to Books page to select a book to reserve
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Close</Button>
            <Button
              variant="contained"
              onClick={() => {
                setOpenDialog(false);
                navigate('/books');
              }}
            >
              Go to Books
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
};

export default Reservations;