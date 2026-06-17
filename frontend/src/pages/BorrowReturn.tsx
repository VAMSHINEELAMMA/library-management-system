import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Button, Box, AppBar, Toolbar } from '@mui/material';

const BorrowReturn: React.FC = () => {
  const navigate = useNavigate();

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>📤 Borrow/Return</Typography>
          <Button color="inherit" onClick={() => navigate('/dashboard')}>Dashboard</Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4">Borrow & Return Books</Typography>
        <Typography variant="body1" sx={{ mt: 2 }}>Coming soon...</Typography>
      </Container>
    </>
  );
};

export default BorrowReturn;