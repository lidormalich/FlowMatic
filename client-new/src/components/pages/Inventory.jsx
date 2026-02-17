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
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">טוען...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-1">ניהול מלאי</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">נהל את המוצרים והחומרים של העסק</p>
        </div>
        <button onClick={openCreateModal} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2.5 rounded-full shadow-lg shadow-blue-500/25 transition-all duration-200 active:scale-95">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          <span className="hidden sm:inline">הוסף פריט</span>
          <span className="sm:hidden">הוסף</span>
        </button>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="mb-5 p-4 bg-red-50/80 dark:bg-red-900/20 backdrop-blur-xl border border-red-200/50 dark:border-red-800/30 rounded-2xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-red-100 dark:bg-red-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
            </div>
            <h3 className="text-red-700 dark:text-red-400 font-bold text-sm">מלאי נמוך ({lowStockItems.length} פריטים)</h3>
          </div>
          <div className="flex flex-wrap gap-1.5 mr-10">
            {lowStockItems.map(item => (
              <span key={item._id} className="px-2.5 py-1 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-full text-xs font-semibold">
                {item.name}: {item.currentStock}/{item.minStock}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Items Grid */}
      {items.length === 0 ? (
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-white/[0.08] p-12 text-center">
          <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">אין פריטי מלאי עדיין</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">התחל בהוספת המוצרים והחומרים שלך</p>
          <button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-2.5 rounded-full shadow-lg shadow-blue-500/25 transition-all active:scale-95">
            הוסף פריט ראשון
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => {
            const isLow = item.currentStock < item.minStock;
            return (
              <div key={item._id} className={`bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/[0.08] p-5 transition-all duration-200 hover:shadow-lg ${isLow ? 'ring-2 ring-red-300/50 dark:ring-red-700/30' : ''}`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{item.name}</h3>
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">{item.unit}</span>
                  </div>
                  {isLow && (
                    <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-bold rounded-lg">
                      מלאי נמוך
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-end justify-between mb-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl p-3">
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${isLow ? 'text-red-600' : 'text-blue-600 dark:text-blue-400'}`}>{item.currentStock}</p>
                    <p className="text-[10px] text-slate-400 font-semibold">נוכחי</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-slate-500 dark:text-slate-400">{item.minStock}</p>
                    <p className="text-[10px] text-slate-400 font-semibold">מינימום</p>
                  </div>
                  {item.costPerUnit > 0 && (
                    <div className="text-center">
                      <p className="text-lg font-semibold text-slate-500 dark:text-slate-400">₪{item.costPerUnit}</p>
                      <p className="text-[10px] text-slate-400 font-semibold">ליחידה</p>
                    </div>
                  )}
                </div>

                {/* Quick Adjust */}
                <div className="flex gap-1.5 mb-4">
                  <button onClick={() => adjustMutation.mutate({ id: item._id, amount: -5 })} className="flex-1 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 font-bold py-2 rounded-xl transition-colors text-sm active:scale-95">-5</button>
                  <button onClick={() => adjustMutation.mutate({ id: item._id, amount: -1 })} className="flex-1 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 font-bold py-2 rounded-xl transition-colors text-lg active:scale-95">-1</button>
                  <button onClick={() => adjustMutation.mutate({ id: item._id, amount: 1 })} className="flex-1 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 font-bold py-2 rounded-xl transition-colors text-lg active:scale-95">+1</button>
                  <button onClick={() => adjustMutation.mutate({ id: item._id, amount: 5 })} className="flex-1 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 font-bold py-2 rounded-xl transition-colors text-sm active:scale-95">+5</button>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                  <button onClick={() => openEditModal(item)} className="flex-1 flex items-center justify-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold py-2 rounded-xl text-xs hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors active:scale-95">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    עריכה
                  </button>
                  <button onClick={() => handleDelete(item._id)} className="flex-1 flex items-center justify-center gap-1.5 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 font-semibold py-2 rounded-xl text-xs hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors active:scale-95">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    מחק
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()} style={{ animation: 'slideUp 0.3s cubic-bezier(0.22,1,0.36,1)' }}>
            {/* Handle (mobile) */}
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="w-9 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
            </div>

            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white sm:rounded-t-3xl">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">{editMode ? 'עריכת פריט' : 'הוספת פריט חדש'}</h2>
                <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 text-right">שם המוצר *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full h-12 bg-slate-100 dark:bg-slate-700 border-0 rounded-2xl px-4 text-slate-900 dark:text-white text-right placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-600 transition-all outline-none" placeholder="לדוגמה: צבע שיער, שמפו" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 text-right">יחידת מידה</label>
                  <input type="text" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} className="w-full h-12 bg-slate-100 dark:bg-slate-700 border-0 rounded-2xl px-4 text-slate-900 dark:text-white text-right placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-600 transition-all outline-none" placeholder="יחידות, מ״ל, גרם" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 text-right">עלות ליחידה (₪)</label>
                  <input type="number" value={formData.costPerUnit} onChange={(e) => setFormData({ ...formData, costPerUnit: +e.target.value })} min="0" step="0.01" className="w-full h-12 bg-slate-100 dark:bg-slate-700 border-0 rounded-2xl px-4 text-slate-900 dark:text-white text-right focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-600 transition-all outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 text-right">מלאי נוכחי</label>
                  <input type="number" value={formData.currentStock} onChange={(e) => setFormData({ ...formData, currentStock: +e.target.value })} min="0" className="w-full h-12 bg-slate-100 dark:bg-slate-700 border-0 rounded-2xl px-4 text-slate-900 dark:text-white text-right focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-600 transition-all outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 text-right">מלאי מינימלי</label>
                  <input type="number" value={formData.minStock} onChange={(e) => setFormData({ ...formData, minStock: +e.target.value })} min="0" className="w-full h-12 bg-slate-100 dark:bg-slate-700 border-0 rounded-2xl px-4 text-slate-900 dark:text-white text-right focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-600 transition-all outline-none" />
                </div>
              </div>

              {/* Actions - action LEFT, cancel RIGHT */}
              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-700" style={{ direction: 'ltr' }}>
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-2xl shadow-lg shadow-blue-500/25 transition-all active:scale-[0.97]">
                  {editMode ? 'שמור שינויים' : 'הוסף פריט'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold py-3 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0.5; }
          to { transform: translateY(0); opacity: 1; }
        }
        @media (min-width: 640px) {
          @keyframes slideUp {
            from { transform: scale(0.95); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
        }
      `}</style>
    </div>
  );
};

export default Inventory;
