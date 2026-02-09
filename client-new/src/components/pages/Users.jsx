import { useState } from 'react';
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

  const handleCredits = async (userId, currentCredits) => {
    const creditsToAdd = prompt(`כמה קרדיטים להוסיף/להוריד?\n(מספר חיובי להוספה, שלילי להפחתה)`, '0');
    if (creditsToAdd === null) return;

    const numCredits = parseInt(creditsToAdd);
    if (isNaN(numCredits)) {
      toast.error('יש להזין מספר תקין');
      return;
    }

    updateCredits({ id: userId, amount: numCredits });
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
      client: { text: 'לקוח', color: 'bg-gray-100 text-gray-700' },
    };
    return badges[role] || badges.client;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-gray-600 text-lg">טוען משתמשים...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">ניהול משתמשים</h1>
          <p className="text-gray-600">נהל משתמשים, קרדיטים והרשאות במערכת</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-gradient-to-r from-primary to-secondary text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
        >
          ➕ הוסף משתמש
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2 text-right">חיפוש</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="חפש לפי שם, אימייל או username..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-right"
            />
          </div>

          {/* Role Filter */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2 text-right">סינון לפי תפקיד</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-right"
            >
              <option value="all">כל התפקידים</option>
              <option value="admin">מנהלים</option>
              <option value="business_owner">בעלי עסקים</option>
              <option value="client">לקוחות</option>
            </select>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600 text-right">
          מציג {filteredUsers.length} מתוך {users.length} משתמשים
        </div>
      </div>

      {/* Users Table */}
      {filteredUsers.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">לא נמצאו משתמשים</h3>
          <p className="text-gray-600">נסה לשנות את הפילטרים או להוסיף משתמש חדש</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-primary to-secondary text-white">
                <tr>
                  <th className="px-6 py-4 text-right font-semibold">שם</th>
                  <th className="px-6 py-4 text-right font-semibold">אימייל</th>
                  <th className="px-6 py-4 text-right font-semibold">Username</th>
                  <th className="px-6 py-4 text-right font-semibold">תפקיד</th>
                  <th className="px-6 py-4 text-right font-semibold">קרדיטים</th>
                  <th className="px-6 py-4 text-right font-semibold">סטטוס</th>
                  <th className="px-6 py-4 text-right font-semibold">תאריך הצטרפות</th>
                  <th className="px-6 py-4 text-right font-semibold">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => {
                  const roleBadge = getRoleBadge(user.role);
                  return (
                    <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-right">
                        <div className="font-semibold text-gray-800">{user.name}</div>
                        {user.businessName && (
                          <div className="text-sm text-gray-500">{user.businessName}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-left">
                        <div className="text-gray-700" dir="ltr">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 text-left">
                        <div className="text-gray-700 font-mono" dir="ltr">
                          {user.username || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${roleBadge.color}`}>
                          {roleBadge.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <span className="font-bold text-gray-800">{user.credits || 0}</span>
                          <button
                            onClick={() => handleCredits(user._id, user.credits || 0)}
                            className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded hover:bg-yellow-200"
                            title="עדכן קרדיטים"
                          >
                            💰
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${user.isSuspended
                              ? 'bg-red-100 text-red-700'
                              : user.isActive
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                        >
                          {user.isSuspended ? 'מושעה' : user.isActive ? 'פעיל' : 'לא פעיל'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-gray-700">
                        {new Date(user.createdAt || user.date).toLocaleDateString('he-IL')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => openEditModal(user)}
                            className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg hover:bg-blue-100 transition-colors text-sm font-semibold"
                            title="עריכה"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleSuspend(user._id, user.isSuspended)}
                            className={`px-3 py-1 rounded-lg transition-colors text-sm font-semibold ${user.isSuspended
                                ? 'bg-green-50 text-green-600 hover:bg-green-100'
                                : 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
                              }`}
                            title={user.isSuspended ? 'הפעל' : 'השעה'}
                          >
                            {user.isSuspended ? '✓' : '⏸️'}
                          </button>
                          <button
                            onClick={() => handleDelete(user._id)}
                            className="bg-red-50 text-red-600 px-3 py-1 rounded-lg hover:bg-red-100 transition-colors text-sm font-semibold"
                            title="מחיקה"
                          >
                            🗑️
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-primary to-secondary p-6 text-white">
              <h2 className="text-3xl font-bold">
                {editingUser ? 'עריכת משתמש' : 'הוספת משתמש חדש'}
              </h2>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 text-right">
                    שם מלא <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-right"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 text-right">
                    אימייל <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    dir="ltr"
                    required
                  />
                </div>

                {/* Username */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 text-right">
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    pattern="[a-z0-9-]+"
                    title="רק אותיות אנגליות קטנות, מספרים ומקפים"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    dir="ltr"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 text-right">
                    סיסמה {editingUser && '(השאר ריק אם לא רוצה לשנות)'}
                    {!editingUser && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    minLength="6"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    dir="ltr"
                    required={!editingUser}
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 text-right">
                    תפקיד <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-right"
                    required
                  >
                    <option value="client">לקוח</option>
                    <option value="business_owner">בעל עסק</option>
                    <option value="admin">מנהל</option>
                  </select>
                </div>

                {/* Credits */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 text-right">
                    קרדיטים
                  </label>
                  <input
                    type="number"
                    name="credits"
                    value={formData.credits}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-right"
                  />
                </div>

                {/* Business Name */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 text-right">
                    שם העסק
                  </label>
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-right"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 text-right">
                    טלפון
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-6 mt-6 border-t border-gray-200">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-primary to-secondary text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all"
                >
                  {editingUser ? '💾 שמור שינויים' : '➕ הוסף משתמש'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  ❌ ביטול
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
