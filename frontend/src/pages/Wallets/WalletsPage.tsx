import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Fab,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  AccountBalanceWallet as WalletIcon,
  People as PeopleIcon,
  Security as SecurityIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';

// Components
import WalletCard from '@/components/Wallet/WalletCard';
import CreateWalletDialog from '@/components/Wallet/CreateWalletDialog';
import ImportWalletDialog from '@/components/Wallet/ImportWalletDialog';

// Services
import { walletService } from '@/services/walletService';

// Types
import { Wallet } from '@/services/walletService';

const WalletsPage: React.FC = () => {
  const navigate = useNavigate();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);

  // Fetch wallets
  const {
    data: walletsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['wallets', page, pageSize],
    queryFn: () => walletService.getWallets(page, pageSize),
    keepPreviousData: true,
  });

  // Export wallet mutation
  const exportWalletMutation = useMutation({
    mutationFn: ({ walletId, format }: { walletId: string; format: string }) =>
      walletService.exportWalletData(walletId, format),
    onSuccess: (blob, variables) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wallet-${variables.walletId}.${variables.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Wallet exported successfully');
    },
    onError: () => {
      toast.error('Failed to export wallet');
    },
  });

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, wallet: Wallet) => {
    setAnchorEl(event.currentTarget);
    setSelectedWallet(wallet);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedWallet(null);
  };

  const handleExportWallet = (format: string) => {
    if (selectedWallet) {
      exportWalletMutation.mutate({ walletId: selectedWallet.id, format });
    }
    handleMenuClose();
  };

  const handleImportWallet = () => {
    setImportDialogOpen(true);
  };

  const handleCreateWallet = () => {
    setCreateDialogOpen(true);
  };

  const handleWalletClick = (walletId: string) => {
    navigate(`/wallets/${walletId}`);
  };

  const handleRefresh = () => {
    refetch();
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load wallets. Please try again.
        </Alert>
        <Button variant="outlined" onClick={handleRefresh} startIcon={<RefreshIcon />}>
          Retry
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Multi-Signature Wallets
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={handleImportWallet}
          >
            Import Wallet
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateWallet}
          >
            Create Wallet
          </Button>
        </Box>
      </Box>

      {isLoading && walletsData?.wallets.length === 0 ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {walletsData?.wallets.length === 0 && !isLoading ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <WalletIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No wallets yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Create your first multi-signature wallet to get started
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateWallet}
              >
                Create Your First Wallet
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {walletsData?.wallets.map((wallet) => (
                <Grid item xs={12} sm={6} md={4} key={wallet.id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'pointer',
                      '&:hover': {
                        boxShadow: 4,
                      },
                    }}
                    onClick={() => handleWalletClick(wallet.id)}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="h6" component="h2" noWrap>
                          {wallet.name}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMenuClick(e, wallet);
                          }}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Chip
                          label={wallet.stellarNetwork}
                          size="small"
                          color="primary"
                          sx={{ mb: 1 }}
                        />
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {wallet.contractAddress}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PeopleIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {wallet.owners.length} owners
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <SecurityIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {wallet.threshold}/{wallet.owners.length}
                          </Typography>
                        </Box>
                      </Box>

                      {wallet.balance !== undefined && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Balance
                          </Typography>
                          <Typography variant="h6">
                            {wallet.balance} XLM
                          </Typography>
                        </Box>
                      )}

                      <Typography variant="body2" color="text.secondary">
                        Created {new Date(wallet.createdAt).toLocaleDateString()}
                      </Typography>
                    </CardContent>

                    <CardActions sx={{ p: 2, pt: 0 }}>
                      <Button size="small" onClick={(e) => {
                        e.stopPropagation();
                        handleWalletClick(wallet.id);
                      }}>
                        View Details
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {walletsData && walletsData.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Button
                disabled={page === 1}
                onClick={() => handlePageChange(page - 1)}
                sx={{ mr: 2 }}
              >
                Previous
              </Button>
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                Page {page} of {walletsData.totalPages}
              </Typography>
              <Button
                disabled={page === walletsData.totalPages}
                onClick={() => handlePageChange(page + 1)}
                sx={{ ml: 2 }}
              >
                Next
              </Button>
            </Box>
          )}
        </>
      )}

      {/* Floating Action Button for creating wallet */}
      <Fab
        color="primary"
        aria-label="create wallet"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          display: { xs: 'flex', sm: 'none' },
        }}
        onClick={handleCreateWallet}
      >
        <AddIcon />
      </Fab>

      {/* Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleExportWallet('json')}>
          <DownloadIcon sx={{ mr: 1 }} />
          Export as JSON
        </MenuItem>
        <MenuItem onClick={() => handleExportWallet('csv')}>
          <DownloadIcon sx={{ mr: 1 }} />
          Export as CSV
        </MenuItem>
      </Menu>

      {/* Create Wallet Dialog */}
      <CreateWalletDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={() => {
          setCreateDialogOpen(false);
          refetch();
        }}
      />

      {/* Import Wallet Dialog */}
      <ImportWalletDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onSuccess={() => {
          setImportDialogOpen(false);
          refetch();
        }}
      />
    </Container>
  );
};

export default WalletsPage;
