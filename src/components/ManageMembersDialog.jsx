import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, List, ListItem, ListItemText, IconButton,
  TextField, Box, Typography, Divider, Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { useAppContext } from '../context/AppContext';

const ManageMembersDialog = ({ open, onClose }) => {
  const { members, addMember, editMember, deleteMember } = useAppContext();

  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberMobile, setNewMemberMobile] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [editingMobile, setEditingMobile] = useState('');
  const [error, setError] = useState('');

  const handleAdd = () => {
    setError('');
    if (newMemberName.trim()) {
      if (newMemberMobile.trim()) {
        const isDuplicate = members.some(m => m.mobile === newMemberMobile.trim());
        if (isDuplicate) {
          setError('Mobile number already exists.');
          return;
        }
      }
      addMember(newMemberName.trim(), newMemberMobile.trim());
      setNewMemberName('');
      setNewMemberMobile('');
    }
  };

  const startEdit = (member) => {
    setEditingId(member.id);
    setEditingName(member.name);
    setEditingMobile(member.mobile || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
    setEditingMobile('');
    setError('');
  };

  const saveEdit = (id) => {
    setError('');
    if (editingName.trim()) {
      if (editingMobile.trim()) {
        const isDuplicate = members.some(m => m.id !== id && m.mobile === editingMobile.trim());
        if (isDuplicate) {
          setError('Mobile number already exists.');
          return;
        }
      }
      editMember(id, editingName.trim(), editingMobile.trim());
      setEditingId(null);
      setEditingName('');
      setEditingMobile('');
    }
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}? All their ledger history will be permanently lost.`)) {
      deleteMember(id);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 700, color: 'primary.main', pb: 1 }}>
        Manage Members
      </DialogTitle>
      <DialogContent sx={{ minHeight: 300 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Add, rename, or remove members from the pool.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <List sx={{ bgcolor: 'background.paper', borderRadius: 2, border: '1px solid #E2E8F0', mb: 3 }}>
          {members.map((member) => (
            <ListItem
              key={member.id}
              divider
              sx={{ '&:last-child': { borderBottom: 'none' } }}
              secondaryAction={
                editingId === member.id ? (
                  <Box>
                    <IconButton edge="end" color="success" onClick={() => saveEdit(member.id)}>
                      <CheckIcon />
                    </IconButton>
                    <IconButton edge="end" color="error" onClick={cancelEdit}>
                      <CloseIcon />
                    </IconButton>
                  </Box>
                ) : (
                  <Box>
                    <IconButton edge="end" color="primary" onClick={() => startEdit(member)} sx={{ mr: 1 }}>
                      <EditIcon />
                    </IconButton>
                    <IconButton edge="end" color="error" onClick={() => handleDelete(member.id, member.name)}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                )
              }
            >
              {editingId === member.id ? (
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1, mr: 6, flexGrow: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    autoFocus
                    placeholder="Name"
                  />
                  <TextField
                    fullWidth
                    size="small"
                    value={editingMobile}
                    onChange={(e) => setEditingMobile(e.target.value)}
                    placeholder="Mobile Number"
                  />
                </Box>
              ) : (
                <ListItemText
                  primary={member.name}
                  primaryTypographyProps={{ fontWeight: 600 }}
                  secondary={` ${member.mobile ? ` Mobile: ${member.mobile}` : ''}`}
                />
              )}
            </ListItem>
          ))}
          {members.length === 0 && (
            <ListItem>
              <ListItemText primary="No members found." sx={{ color: 'text.secondary' }} />
            </ListItem>
          )}
        </List>

        <Divider sx={{ my: 2 }} />

        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            bgcolor: { xs: 'background.paper', sm: 'transparent' },
            p: { xs: 2, sm: 0 },
            borderRadius: { xs: 2, sm: 0 },
            border: { xs: '1px solid', sm: 'none' },
            borderColor: 'divider'
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: { xs: 2, sm: 1 } }}>
            Add New Member
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 2, sm: 1 } }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Enter member name..."
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
            />
            <TextField
              fullWidth
              size="small"
              placeholder="Mobile number (optional)"
              value={newMemberMobile}
              onChange={(e) => setNewMemberMobile(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
            />
            <Button 
              variant="contained" 
              onClick={handleAdd} 
              disabled={!newMemberName.trim()}
              sx={{ minWidth: { sm: '80px' }, height: { xs: '40px', sm: 'auto' } }}
            >
              Add
            </Button>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button onClick={onClose} variant="outlined">Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ManageMembersDialog;
