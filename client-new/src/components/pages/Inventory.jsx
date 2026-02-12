import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '../../services/api';
import { toast } from 'react-toastify';

const Inventory = () => {
  const queryClient = useQueryClient();
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: inventoryApi.getAll
  });

  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', unit: 'יחידות', currentStock: 0, minStock: 0, costPerUnit: 0 });

  const createMutation = useMutation({
    mutationFn: inventoryApi.create,
    onSuccess: () => { queryClient.invalidateQueries(['inventory']); toast.success('פריט נוצר בהצלחה'); setShowModal(false); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => inventoryApi.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries(['inventory']); toast.success('פריט עודכן בהצלחה'); setShowModal(false); }
  });

  const deleteMutation = useMutation({
    mutationFn: inventoryApi.delete,
    onSuccess: () => { queryClient.invalidateQueries(['inventory']); toast.success('פריט נמחק'); }
  });

  const adjustMutation = useMutation({
    mutationFn: ({ id, amount }) => inventoryApi.adjust(id, amount),
    onSuccess: () => { queryClient.invalidateQueries(['inventory']); }
  });

  const openCreateModal = () => {
    setEditMode(false);
    setCurrentItem(null);
    setFormData({ name: '', unit: 'יחידות', currentStock: 0, minStock: 0, costPerUnit: 0 });
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditMode(true);
    setCurrentItem(item);
    setFormData({ name: item.name, unit: item.unit, currentStock: item.currentStock, minStock: item.minStock, costPerUnit: item.costPerUnit });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) { toast.error('שם המוצר הוא שדה חובה'); return; }
    if (editMode) {
      updateMutation.mutate({ id: currentItem._id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק פריט זה?')) return;
    deleteMutation.mutate(id);
  };

  const lowStockItems = items.filter(i => i.currentStock < i.minStock);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-gray-600 text-lg">טוען...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-1">ניהול מלאי</h1>
          <p className="text-slate-500 dark:text-slate-400">נהל את המוצרים והחומרים של העסק</p>
        </div>
        <button onClick={openCreateModal} className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all">
          ➕ הוסף פריט
        </button>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
          <h3 className="text-red-700 dark:text-red-400 font-bold mb-2">⚠️ מלאי נמוך ({lowStockItems.length} פריטים)</h3>
          <div className="flex flex-wrap gap-2">
            {lowStockItems.map(item => (
              <span key={item._id} className="px-3 py-1 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-full text-sm font-medium">
                {item.name}: {item.currentStock}/{item.minStock} {item.unit}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Items Grid */}
      {items.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-12 text-center">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">אין פריטי מלאי עדיין</h3>
          <p className="text-gray-600 dark:text-slate-400 mb-6">התחל בהוספת המוצרים והחומרים שלך</p>
          <button onClick={openCreateModal} className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold px-6 py-3 rounded-xl">
            ➕ הוסף פריט ראשון
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map(item => {
            const isLow = item.currentStock < item.minStock;
            return (
              <div key={item._id} className={`bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-5 transition-all hover:shadow-xl ${isLow ? 'ring-2 ring-red-300 dark:ring-red-700' : ''}`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{item.name}</h3>
                    <span className="text-sm text-slate-500 dark:text-slate-400">{item.unit}</span>
                  </div>
                  {isLow && <span className="px-2 py-1 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-xs font-bold rounded-lg">מלאי נמוך!</span>}
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="text-center">
                    <p className={`text-3xl font-bold ${isLow ? 'text-red-600' : 'text-blue-600 dark:text-blue-400'}`}>{item.currentStock}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">מלאי נוכחי</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-slate-600 dark:text-slate-300">{item.minStock}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">מינימום</p>
                  </div>
                  {item.costPerUnit > 0 && (
                    <div className="text-center">
                      <p className="text-lg font-semibold text-slate-600 dark:text-slate-300">₪{item.costPerUnit}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">ליחידה</p>
                    </div>
                  )}
                </div>

                {/* Quick Adjust */}
                <div className="flex gap-2 mb-4">
                  <button onClick={() => adjustMutation.mutate({ id: item._id, amount: -1 })} className="flex-1 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 text-red-600 font-bold py-2 rounded-xl transition-colors text-lg">-1</button>
                  <button onClick={() => adjustMutation.mutate({ id: item._id, amount: -5 })} className="flex-1 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 text-red-600 font-bold py-2 rounded-xl transition-colors">-5</button>
                  <button onClick={() => adjustMutation.mutate({ id: item._id, amount: 5 })} className="flex-1 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 text-green-600 font-bold py-2 rounded-xl transition-colors">+5</button>
                  <button onClick={() => adjustMutation.mutate({ id: item._id, amount: 1 })} className="flex-1 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 text-green-600 font-bold py-2 rounded-xl transition-colors text-lg">+1</button>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                  <button onClick={() => openEditModal(item)} className="flex-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 font-semibold py-2 rounded-xl hover:bg-blue-100 transition-colors text-sm">✏️ עריכה</button>
                  <button onClick={() => handleDelete(item._id)} className="flex-1 bg-red-50 dark:bg-red-900/20 text-red-600 font-semibold py-2 rounded-xl hover:bg-red-100 transition-colors text-sm">🗑️ מחק</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-lg w-full">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-6 text-white rounded-t-3xl">
              <h2 className="text-2xl font-bold">{editMode ? 'עריכת פריט' : 'הוספת פריט חדש'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 text-right">שם המוצר *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full h-12 bg-slate-100 dark:bg-slate-700 border-0 rounded-2xl px-4 text-slate-900 dark:text-white text-right focus:ring-2 focus:ring-blue-500 outline-none" placeholder="לדוגמה: צבע שיער, שמפו" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 text-right">יחידת מידה</label>
                  <input type="text" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} className="w-full h-12 bg-slate-100 dark:bg-slate-700 border-0 rounded-2xl px-4 text-slate-900 dark:text-white text-right focus:ring-2 focus:ring-blue-500 outline-none" placeholder="יחידות, מ״ל, גרם" />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 text-right">עלות ליחידה (₪)</label>
                  <input type="number" value={formData.costPerUnit} onChange={(e) => setFormData({ ...formData, costPerUnit: +e.target.value })} min="0" step="0.01" className="w-full h-12 bg-slate-100 dark:bg-slate-700 border-0 rounded-2xl px-4 text-slate-900 dark:text-white text-right focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 text-right">מלאי נוכחי</label>
                  <input type="number" value={formData.currentStock} onChange={(e) => setFormData({ ...formData, currentStock: +e.target.value })} min="0" className="w-full h-12 bg-slate-100 dark:bg-slate-700 border-0 rounded-2xl px-4 text-slate-900 dark:text-white text-right focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 text-right">מלאי מינימלי</label>
                  <input type="number" value={formData.minStock} onChange={(e) => setFormData({ ...formData, minStock: +e.target.value })} min="0" className="w-full h-12 bg-slate-100 dark:bg-slate-700 border-0 rounded-2xl px-4 text-slate-900 dark:text-white text-right focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold py-3 rounded-xl shadow-lg transition-all">{editMode ? '💾 שמור' : '➕ הוסף'}</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold py-3 rounded-xl transition-colors">ביטול</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
