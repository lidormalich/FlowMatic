# /add-crud

Template for creating a new CRUD page component + backend routes with all best practices.

## Backend Setup

Create `routes/api/[resource].js`:

```js
const router = require('express').Router();
const auth = require('../../middleware/auth');
const asyncHandler = require('../../utils/asyncHandler');
const { notFound } = require('../../utils/respond');
const MyModel = require('../../models/MyModel');

// List
router.get('/', auth, asyncHandler(async (req, res) => {
  const items = await MyModel.find({ businessOwnerId: req.user.id });
  res.json(items);
}));

// Get one
router.get('/:id', auth, asyncHandler(async (req, res) => {
  const item = await MyModel.findOne({ _id: req.params.id, businessOwnerId: req.user.id });
  if (!item) return notFound(res, 'פריט');
  res.json(item);
}));

// Create
router.post('/', auth, asyncHandler(async (req, res) => {
  const item = new MyModel({ ...req.body, businessOwnerId: req.user.id });
  await item.save();
  res.json(item);
}));

// Update
router.put('/:id', auth, asyncHandler(async (req, res) => {
  const item = await MyModel.findOneAndUpdate(
    { _id: req.params.id, businessOwnerId: req.user.id },
    req.body,
    { new: true }
  );
  if (!item) return notFound(res, 'פריט');
  res.json(item);
}));

// Delete
router.delete('/:id', auth, asyncHandler(async (req, res) => {
  const item = await MyModel.findOneAndDelete({ _id: req.params.id, businessOwnerId: req.user.id });
  if (!item) return notFound(res, 'פריט');
  res.json({ message: 'נמחק בהצלחה' });
}));

module.exports = router;
```

## Frontend Hook

Create `src/hooks/useMyResource.js`:

```js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

export const useMyResources = (options) => {
  return useQuery({
    queryKey: ['myResources'],
    queryFn: async () => (await api.get('/my-resource')).data,
    ...options
  });
};

export const useCreateMyResource = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/my-resource', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myResources'] })
  });
};

export const useUpdateMyResource = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/my-resource/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myResources'] })
  });
};

export const useDeleteMyResource = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/my-resource/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myResources'] })
  });
};
```

## Frontend Page

Create `src/components/pages/MyResource.jsx`:

```jsx
import React from 'react';
import { Box, Button } from '@mui/material';
import { toast } from 'react-toastify';
import { useMyResources, useCreateMyResource, useUpdateMyResource, useDeleteMyResource } from '../../hooks/useMyResource';
import { useFormData } from '../../hooks/useFormData';
import { useModal } from '../../hooks/useModal';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import SkeletonLoader from '../common/SkeletonLoader';
import EmptyState from '../common/EmptyState';
import ConfirmDialog from '../common/ConfirmDialog';
import AddIcon from '@mui/icons-material/Add';

const MyResourcePage = () => {
  const { data = [], isLoading } = useMyResources();
  const createMutation = useCreateMyResource();
  const updateMutation = useUpdateMyResource();
  const deleteMutation = useDeleteMyResource();

  const { formData, handleInputChange, setFormData, resetForm } = useFormData({ name: '', description: '' });
  const { showModal, modalMode, selectedItem, openCreate, openEdit, closeModal } = useModal();
  const { confirmDialog, openConfirm, closeConfirm } = useConfirmDialog();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'create') {
        await createMutation.mutateAsync(formData);
        toast.success('נוצר בהצלחה');
      } else {
        await updateMutation.mutateAsync({ id: selectedItem._id, ...formData });
        toast.success('עודכן בהצלחה');
      }
      closeModal();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || 'שגיאה');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('נמחק בהצלחה');
      closeConfirm();
    } catch (error) {
      toast.error(error.response?.data?.message || 'שגיאה');
    }
  };

  if (isLoading) return <SkeletonLoader />;

  return (
    <Box>
      <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
        הוסף חדש
      </Button>

      {data.length === 0 ? (
        <EmptyState
          title="אין נתונים"
          description="עדיין לא יצרת פריטים"
          actionLabel="הוסף ראשון"
          action={openCreate}
        />
      ) : (
        <div>{/* Render list */}</div>
      )}

      {showModal && (
        <ConfirmDialog
          open={showModal}
          title={modalMode === 'create' ? 'הוסף חדש' : 'ערוך'}
          onClose={closeModal}
        >
          <form onSubmit={handleSubmit}>
            <input name="name" value={formData.name} onChange={handleInputChange} />
            <Button type="submit">שמור</Button>
          </form>
        </ConfirmDialog>
      )}

      <ConfirmDialog
        open={confirmDialog.open}
        title="מחק פריט?"
        message="פעולה זו לא ניתנת לביטול"
        onConfirm={() => handleDelete(confirmDialog.id)}
        onClose={closeConfirm}
      />
    </Box>
  );
};

export default MyResourcePage;
```

## Checklist

- [ ] Backend route file created with auth + asyncHandler
- [ ] React Query hook file created
- [ ] Page component using useModal, useFormData, useConfirmDialog
- [ ] Toast messages show success/error
- [ ] API namespace exported from `src/services/api.js`
- [ ] Page added to App.jsx router
- [ ] Tested: Create, Read, Update, Delete operations
