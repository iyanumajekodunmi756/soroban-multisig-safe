import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WalletProvider } from './contexts/WalletContext';
import Header from './components/layout/Header';
import { Box, Container } from '@mui/material';
import TransactionList from './components/dashboard/TransactionList';
import TransactionDetails from './components/dashboard/TransactionDetails';
import CreateSafeWizard from './components/wizard/CreateSafeWizard';

const App: React.FC = () => {
  return (
    <WalletProvider>
      <Header />
      <Box mt={4}>
        <Container maxWidth="lg">
          <Router>
            <Routes>
              <Route path="/" element={<TransactionList />} />
              <Route path="/create" element={<CreateSafeWizard />} />
              <Route path="/proposal/:id" element={<TransactionDetails />} />
            </Routes>
          </Router>
        </Container>
      </Box>
    </WalletProvider>
  );
};

export default App;