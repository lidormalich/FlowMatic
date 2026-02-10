import { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useUsers } from '../../hooks/useUsers';

const Users = () => {
  const {
    users,
    isLoading: loading,
    createUser,
    updateUser,
    deleteUser,
    suspendUser,
    updateCredits
  } = useUsers();

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [filterRole, setFilterRole] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [creditsPopover, setCreditsPopover] = useState({ open: false, userId: null, currentCredits: 0 });
  const [creditsInput, setCreditsInput] = useState('');
  const creditsPopoverRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    role: 'business_owner',
    businessName: '',
    phoneNumber: '',
    credits: 0,
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('שם ואימייל הם שדות חובה');
      return;
    }

    if (!editingUser && !formData.password) {
      toast.error('סיסמה היא שדה חובה למשתמש חדש');
      return;
    }

    if (editingUser) {
      // Update existing user
      const updateData = { ...formData };
      if (!updateData.password) {
        delete updateData.password; // Don't update password if empty
      }
      updateUser({ id: editingUser._id, data: updateData });
    } else {
      // Create new user - send password twice for validation
      createUser({
        ...formData,
        password2: formData.password
      });
    }

    setShowModal(false);
    resetForm();
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק משתמש זה?')) return;
    deleteUser(userId);
  };

  const handleSuspend = async (userId, isSuspended) => {
    suspendUser({ id: userId, suspend: !isSuspended });
  };

  // Close credits popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (creditsPopoverRef.current && !creditsPopoverRef.current.contains(e.target)) {
        setCreditsPopover({ open: false, userId: null, currentCredits: 0 });
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openCreditsPopover = (userId, currentCredits) => {
    setCreditsPopover({ open: true, userId, currentCredits });
    setCreditsInput('');
  };

  const handleQuickCredits = (amount) => {
    if (!creditsPopover.userId) return;
    updateCredits({ id: creditsPopover.userId, amount });
    setCreditsPopover({ open: false, userId: null, currentCredits: 0 });
  };

  const handleCustomCredits = () => {
    if (!creditsPopover.userId) return;
    const numCredits = parseInt(creditsInput);
    if (isNaN(numCredits)) {
      toast.error('יש להזין מספר תקין');
      return;
    }
    updateCredits({ id: creditsPopover.userId, amount: numCredits });
    setCreditsPopover({ open: false, userId: null, currentCredits: 0 });
    setCreditsInput('');
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      username: user.username || '',
      password: '',
      role: user.role || 'business_owner',
      businessName: user.businessName || '',
      phoneNumber: user.phoneNumber || '',
      credits: user.credits || 0,
    });
    setShowModal(true);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      username: '',
      password: '',
      role: 'business_owner',
      businessName: '',
      phoneNumber: '',
      credits: 0,
    });
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  // Filtering
  const filteredUsers = users.filter((user) => {
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.username && user.username.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesRole && matchesSearch;
  });

  const getRoleBadge = (role) => {
    const badges = {
      admin: { text: 'מנהל', color: 'bg-red-100 text-red-700' },
      business_owner: { text: 'בעל עסק', color: 'bg-blue-100 text-blue-700' },
      client: { text: 'לקוח', color: 'bg-slate-100 text-slate-700' },
    };
    return badges[role] || badges.client;
  };

  // Icons
  const icons = {
    plus: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    ),
    search: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    users: (
      <svg className="w-16 h-16 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    edit: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    trash: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    ),
    pause: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    play: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    coins: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979a1 1 0 001.715-1.029C12.279 4.784 11.232 4 10 4s-2.279.784-2.979 1.95c-.285.475-.507 1-.67 1.55H6a1 1 0 000 2h.013a9.358 9.358 0 000 1H6a1 1 0 100 2h.351c.163.55.385 1.075.67 1.55C7.721 15.216 8.768 16 10 16s2.279-.784 2.979-1.95a1 1 0 10-1.715-1.029c-.472.786-.96.979-1.264.979-.304 0-.792-.193-1.264-.979a4.265 4.265 0 01-.264-.521H10a1 1 0 100-2H8.017a7.36 7.36 0 010-1H10a1 1 0 100-2H8.472c.08-.185.167-.36.264-.521z" />
      </svg>
    ),
    save: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    close: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 text-lg font-medium">טוען משתמשים...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">ניהול משתמשים</h1>
          <p className="text-slate-500">נהל משתמשים, קרדיטים והרשאות במערכת</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-full shadow-lg shadow-blue-500/30 transition-all duration-200 active:scale-95"
        >
          {icons.plus}
          <span>הוסף משתמש</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl shadow-sm p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2 text-right">חיפוש</label>
            <div className="relative">
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                {icons.search}
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="חפש לפי שם, אימייל או username..."
                className="w-full h-12 bg-slate-100 border-0 rounded-2xl pr-12 pl-4 text-slate-900 text-right
                         placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-white
                         transition-all duration-200 outline-none"
              />
            </div>
          </div>

          {/* Role Filter */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2 text-right">סינון לפי תפקיד</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full h-12 bg-slate-100 border-0 rounded-2xl px-4 text-slate-900 text-right
                       focus:ring-2 focus:ring-blue-500 focus:bg-white
                       transition-all duration-200 outline-none appearance-none cursor-pointer"
            >
              <option value="all">כל התפקידים</option>
              <option value="admin">מנהלים</option>
              <option value="business_owner">בעלי עסקים</option>
              <option value="client">לקוחות</option>
            </select>
          </div>
        </div>

        <div className="mt-4 text-sm text-slate-500 text-right">
          מציג {filteredUsers.length} מתוך {users.length} משתמשים
        </div>
      </div>

      {/* Users Table */}
      {filteredUsers.length === 0 ? (
        <div className="bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl shadow-sm p-12 text-center">
          <div className="flex justify-center mb-4">
            {icons.users}
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">לא נמצאו משתמשים</h3>
          <p className="text-slate-500">נסה לשנות את הפילטרים או להוסיף משתמש חדש</p>
        </div>
      ) : (
        <div className="bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-blue-600 to-blue-500 text-white">
                  <th className="px-6 py-4 text-right font-semibold">שם</th>
                  <th className="px-6 py-4 text-right font-semibold">אימייל</th>
                  <th className="px-6 py-4 text-right font-semibold hidden lg:table-cell">Username</th>
                  <th className="px-6 py-4 text-right font-semibold">תפקיד</th>
                  <th className="px-6 py-4 text-right font-semibold">קרדיטים</th>
                  <th className="px-6 py-4 text-right font-semibold hidden md:table-cell">סטטוס</th>
                  <th className="px-6 py-4 text-right font-semibold hidden lg:table-cell">תאריך הצטרפות</th>
                  <th className="px-6 py-4 text-right font-semibold">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => {
                  const roleBadge = getRoleBadge(user.role);
                  return (
                    <tr key={user._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-right">
                        <div className="font-semibold text-slate-900">{user.name}</div>
                        {user.businessName && (
                          <div className="text-sm text-slate-500">{user.businessName}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-left">
                        <div className="text-slate-600" dir="ltr">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 text-left hidden lg:table-cell">
                        <div className="text-slate-600 font-mono text-sm" dir="ltr">
                          {user.username || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${roleBadge.color}`}>
                          {roleBadge.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right relative">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => openCreditsPopover(user._id, user.credits || 0)}
                            className="flex items-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full transition-all duration-200 font-bold cursor-pointer"
                            title="לחץ לעדכון קרדיטים"
                          >
                            {icons.coins}
                            <span>{user.credits || 0}</span>
                          </button>
                        </div>
                        {/* Credits Popover */}
                        {creditsPopover.open && creditsPopover.userId === user._id && (
                          <div
                            ref={creditsPopoverRef}
                            className="absolute top-full left-0 mt-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-4 z-50 min-w-[240px]"
                          >
                            <div className="text-sm font-semibold text-slate-700 mb-3 text-right">עדכון קרדיטים</div>
                            <div className="grid grid-cols-3 gap-2 mb-3">
                              <button onClick={() => handleQuickCredits(10)} className="bg-green-100 text-green-700 px-2 py-2 rounded-xl hover:bg-green-200 font-semibold text-sm transition-colors">+10</button>
                              <button onClick={() => handleQuickCredits(50)} className="bg-green-100 text-green-700 px-2 py-2 rounded-xl hover:bg-green-200 font-semibold text-sm transition-colors">+50</button>
                              <button onClick={() => handleQuickCredits(100)} className="bg-green-100 text-green-700 px-2 py-2 rounded-xl hover:bg-green-200 font-semibold text-sm transition-colors">+100</button>
                              <button onClick={() => handleQuickCredits(-10)} className="bg-red-100 text-red-700 px-2 py-2 rounded-xl hover:bg-red-200 font-semibold text-sm transition-colors">-10</button>
                              <button onClick={() => handleQuickCredits(-50)} className="bg-red-100 text-red-700 px-2 py-2 rounded-xl hover:bg-red-200 font-semibold text-sm transition-colors">-50</button>
                              <button onClick={() => handleQuickCredits(-100)} className="bg-red-100 text-red-700 px-2 py-2 rounded-xl hover:bg-red-200 font-semibold text-sm transition-colors">-100</button>
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="number"
                                value={creditsInput}
                                onChange={(e) => setCreditsInput(e.target.value)}
                                placeholder="כמות..."
                                className="flex-1 h-10 bg-slate-100 border-0 rounded-xl px-3 text-sm text-right
                                         placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-white
                                         transition-all duration-200 outline-none"
                              />
                              <button
                                onClick={handleCustomCredits}
                                className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-500 transition-colors"
                              >
                                עדכן
                              </button>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right hidden md:table-cell">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${user.isSuspended
                              ? 'bg-red-100 text-red-700'
                              : user.isActive
                                ? 'bg-green-100 text-green-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                        >
                          {user.isSuspended ? 'מושעה' : user.isActive ? 'פעיל' : 'לא פעיל'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-slate-600 hidden lg:table-cell">
                        {new Date(user.createdAt || user.date).toLocaleDateString('he-IL')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all duration-200"
                            title="עריכה"
                          >
                            {icons.edit}
                          </button>
                          <button
                            onClick={() => handleSuspend(user._id, user.isSuspended)}
                            className={`p-2 rounded-xl transition-all duration-200 ${user.isSuspended
                                ? 'bg-green-50 text-green-600 hover:bg-green-100'
                                : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                              }`}
                            title={user.isSuspended ? 'הפעל' : 'השעה'}
                          >
                            {user.isSuspended ? icons.play : icons.pause}
                          </button>
                          <button
                            onClick={() => handleDelete(user._id)}
                            className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all duration-200"
                            title="מחיקה"
                          >
                            {icons.trash}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden animate-scale-in">
            {/* Handle bar for mobile feel */}
            <div className="pt-3 pb-1 md:hidden">
              <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto" />
            </div>

            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 text-white">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">
                  {editingUser ? 'עריכת משתמש' : 'הוספת משתמש חדש'}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  {icons.close}
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 text-right">
                    שם מלא <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full h-12 bg-slate-100 border-0 rounded-2xl px-4 text-slate-900 text-right
                             placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-white
                             transition-all duration-200 outline-none"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 text-right">
                    אימייל <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full h-12 bg-slate-100 border-0 rounded-2xl px-4 text-slate-900 text-left
                             placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-white
                             transition-all duration-200 outline-none"
                    dir="ltr"
                    required
                  />
                </div>

                {/* Username */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 text-right">
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    pattern="[a-z0-9-]+"
                    title="רק אותיות אנגליות קטנות, מספרים ומקפים"
                    className="w-full h-12 bg-slate-100 border-0 rounded-2xl px-4 text-slate-900 text-left
                             placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-white
                             transition-all duration-200 outline-none"
                    dir="ltr"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 text-right">
                    סיסמה {editingUser && <span className="text-slate-400 font-normal">(השאר ריק אם לא רוצה לשנות)</span>}
                    {!editingUser && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    minLength="6"
                    className="w-full h-12 bg-slate-100 border-0 rounded-2xl px-4 text-slate-900 text-left
                             placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-white
                             transition-all duration-200 outline-none"
                    dir="ltr"
                    required={!editingUser}
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 text-right">
                    תפקיד <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full h-12 bg-slate-100 border-0 rounded-2xl px-4 text-slate-900 text-right
                             focus:ring-2 focus:ring-blue-500 focus:bg-white
                             transition-all duration-200 outline-none appearance-none cursor-pointer"
                    required
                  >
                    <option value="client">לקוח</option>
                    <option value="business_owner">בעל עסק</option>
                    <option value="admin">מנהל</option>
                  </select>
                </div>

                {/* Credits */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 text-right">
                    קרדיטים
                  </label>
                  <input
                    type="number"
                    name="credits"
                    value={formData.credits}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full h-12 bg-slate-100 border-0 rounded-2xl px-4 text-slate-900 text-right
                             placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-white
                             transition-all duration-200 outline-none"
                  />
                </div>

                {/* Business Name */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 text-right">
                    שם העסק
                  </label>
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    className="w-full h-12 bg-slate-100 border-0 rounded-2xl px-4 text-slate-900 text-right
                             placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-white
                             transition-all duration-200 outline-none"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 text-right">
                    טלפון
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className="w-full h-12 bg-slate-100 border-0 rounded-2xl px-4 text-slate-900 text-left
                             placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-white
                             transition-all duration-200 outline-none"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 mt-6 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-full shadow-lg shadow-blue-500/30 transition-all duration-200 active:scale-95"
                >
                  {icons.save}
                  <span>{editingUser ? 'שמור שינויים' : 'הוסף משתמש'}</span>
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-6 py-3 rounded-full transition-all duration-200"
                >
                  {icons.close}
                  <span>ביטול</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
