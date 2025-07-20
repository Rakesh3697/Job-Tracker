import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import Login from './Login';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [applications, setApplications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newApplication, setNewApplication] = useState({
    company: '',
    position: '',
    location: '',
    status: 'pending',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    salary: ''
  });
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [editId, setEditId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const API_BASE = '/api/applications';

  const statusOptions = [
    { value: 'pending', label: 'Pending', color: '#FFC107', bgColor: '#FFF8E1' },
    { value: 'interview', label: 'Interview', color: '#2196F3', bgColor: '#E3F2FD' },
    { value: 'offer', label: 'Offer', color: '#4CAF50', bgColor: '#E8F5E9' },
    { value: 'rejected', label: 'Rejected', color: '#F44336', bgColor: '#FFEBEE' }
  ];

  // Fetch applications from backend
  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(API_BASE);
      setApplications(response.data);
    } catch (err) {
      console.error("Error fetching applications:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchApplications();
    }
  }, [isLoggedIn]);

  // Calculate statistics
  const totalApplications = applications.length;
  const pendingCount = applications.filter(app => app.status === 'pending').length;
  const interviewCount = applications.filter(app => app.status === 'interview').length;
  const offersCount = applications.filter(app => app.status === 'offer').length;
  const rejectedCount = applications.filter(app => app.status === 'rejected').length;
  const responseRate = totalApplications > 0
    ? Math.round(((totalApplications - pendingCount) / totalApplications) * 100)
    : 0;

  // Filter and sort applications
  const filteredApplications = applications.filter(app => {
    const matchesSearch =
      app.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || app.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const sortedApplications = [...filteredApplications].sort((a, b) => {
  switch (sortBy) {
    case 'date-asc':
      return new Date(a.date) - new Date(b.date);
    case 'date-desc':
      return new Date(b.date) - new Date(a.date);
    case 'company-asc':
      return a.company.localeCompare(b.company);
    case 'company-desc':
      return b.company.localeCompare(a.company);
    case 'salary-asc':
      return (
        parseInt(a.salary?.replace(/\D/g, '') || 0) -
        parseInt(b.salary?.replace(/\D/g, '') || 0)
      );
    case 'salary-desc':
      return (
        parseInt(b.salary?.replace(/\D/g, '') || 0) -
        parseInt(a.salary?.replace(/\D/g, '') || 0)
      );
    default:
      return 0;
  }
});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewApplication({
      ...newApplication,
      [name]: value
    });
  };

  const handleAddApplication = async () => {
    if (newApplication.company && newApplication.position) {
      try {
        if (editId) {
          // Update existing application
          await axios.put(`${API_BASE}/${editId}`, newApplication);
          setApplications(applications.map(app =>
            app._id === editId ? newApplication : app
          ));
          setEditId(null);
        } else {
          // Add new application
          const response = await axios.post(API_BASE, newApplication);
          setApplications([...applications, response.data]);
        }
        resetForm();
      } catch (err) {
        console.error("Error saving application:", err);
      }
    }
  };

  const deleteApplication = async (id) => {
    try {
      await axios.delete(`${API_BASE}/${id}`);
      setApplications(applications.filter(app => app._id !== id));
    } catch (err) {
      console.error("Error deleting application:", err);
    }
  };

  const editApplication = (id) => {
    const appToEdit = applications.find(app => app._id === id);
    setNewApplication({
      ...appToEdit,
      date: appToEdit.date.split('T')[0] // Format date for input
    });
    setEditId(id);
    setShowAddForm(true);
  };

  const resetForm = () => {
    setNewApplication({
      company: '',
      position: '',
      location: '',
      status: 'pending',
      date: new Date().toISOString().split('T')[0],
      notes: '',
      salary: ''
    });
    setShowAddForm(false);
    setEditId(null);
  };

  const exportToCSV = () => {
    const headers = ['Company', 'Position', 'Location', 'Status', 'Date', 'Salary', 'Notes'];
    const rows = applications.map(app => [
      `"${app.company}"`,
      `"${app.position}"`,
      `"${app.location}"`,
      app.status,
      new Date(app.date).toLocaleDateString(),
      app.salary,
      `"${app.notes}"`
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers, ...rows].map(e => e.join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'job_applications.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  if (isLoading) {
    return <div className="loading">Loading applications...</div>;
  }

  return (
    <div className="job-tracker">
      <header className="header">
        <h1>Job Tracker</h1>
        <p>Manage your job applications</p>
      </header>

      <div className="stats-container">
        <div className="stat-card" style={{ backgroundColor: '#E3F2FD' }}>
          <h3>Total Applications</h3>
          <p>{totalApplications}</p>
        </div>
        <div className="stat-card" style={{ backgroundColor: '#FFF8E1' }}>
          <h3>Response Rate</h3>
          <p>{responseRate}%</p>
        </div>
        <div className="stat-card" style={{ backgroundColor: '#FFECB3' }}>
          <h3>Pending</h3>
          <p>{pendingCount}</p>
        </div>
        <div className="stat-card" style={{ backgroundColor: '#C8E6C9' }}>
          <h3>Offers</h3>
          <p>{offersCount}</p>
        </div>
        <div className="stat-card" style={{ backgroundColor: '#FFCDD2' }}>
          <h3>Rejected</h3>
          <p>{rejectedCount}</p>
        </div>
        <div className="stat-card" style={{ backgroundColor: '#BBDEFB' }}>
          <h3>Interviews</h3>
          <p>{interviewCount}</p>
        </div>
      </div>

      <div className="controls">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search companies, positions, or locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-container">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="company-asc">Company (A-Z)</option>
            <option value="company-desc">Company (Z-A)</option>
            <option value="salary-desc">Salary (High-Low)</option>
            <option value="salary-asc">Salary (Low-High)</option>
          </select>
          <button className="add-button" onClick={() => setShowAddForm(true)}>
            + Add Application
          </button>
          <button className="export-button" onClick={exportToCSV}>
            Export CSV
          </button>
        </div>
      </div>

      <div className="applications-list">
        {sortedApplications.length > 0 ? (
          <>
            <div className="list-header">
              <span>Company</span>
              <span>Position</span>
              <span>Location</span>
              <span>Status</span>
              <span>Date</span>
              <span>Salary</span>
              <span>Actions</span>
            </div>
            {sortedApplications.map((app) => (
              <div key={app._id} className="application-item">
                <span>{app.company}</span>
                <span>{app.position}</span>
                <span>{app.location}</span>
                <span className="status" style={{
                  backgroundColor: statusOptions.find(o => o.value === app.status)?.color || '#EEE',
                  color: app.status === 'pending' ? '#000' : '#FFF'
                }}>
                  {statusOptions.find(o => o.value === app.status)?.label}
                </span>
                <span>{new Date(app.date).toLocaleDateString()}</span>
                <span>{app.salary}</span>
                <span className="actions">
                  <button className="edit-btn" onClick={() => editApplication(app._id)}>Edit</button>
                  <button className="delete-btn" onClick={() => deleteApplication(app._id)}>Delete</button>
                </span>
              </div>
            ))}
          </>
        ) : (
          <div className="empty-state">
            {applications.length === 0 ? (
              <>
                <h3>No applications yet</h3>
                <p>Start tracking your job applications by adding your first one.</p>
                <button className="add-button" onClick={() => setShowAddForm(true)}>
                  + Add Your First Application
                </button>
              </>
            ) : (
              <>
                <h3>No matching applications found</h3>
                <p>Try adjusting your search or filter criteria.</p>
              </>
            )}
          </div>
        )}
      </div>

      {showAddForm && (
        <div className="modal">
          <div className="modal-content">
            <h2>{editId ? 'Edit Application' : 'Add New Application'}</h2>
            <div className="form-group">
              <label>Company *</label>
              <input 
                type="text" 
                name="company" 
                value={newApplication.company} 
                onChange={handleInputChange} 
                required 
              />
            </div>
            <div className="form-group">
              <label>Position *</label>
              <input 
                type="text" 
                name="position" 
                value={newApplication.position} 
                onChange={handleInputChange} 
                required 
              />
            </div>
            <div className="form-group">
              <label>Location</label>
              <input 
                type="text" 
                name="location" 
                value={newApplication.location} 
                onChange={handleInputChange} 
              />
            </div>
            <div className="form-group">
              <label>Salary</label>
              <input 
                type="text" 
                name="salary" 
                value={newApplication.salary} 
                onChange={handleInputChange} 
                placeholder="e.g. $80,000" 
              />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select 
                name="status" 
                value={newApplication.status} 
                onChange={handleInputChange}
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Date</label>
              <input 
                type="date" 
                name="date" 
                value={newApplication.date} 
                onChange={handleInputChange} 
              />
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea 
                name="notes" 
                value={newApplication.notes} 
                onChange={handleInputChange} 
              />
            </div>
            <div className="form-actions">
              <button type="button" onClick={resetForm}>Cancel</button>
              <button 
                type="button" 
                onClick={handleAddApplication}
                disabled={!newApplication.company || !newApplication.position}
              >
                {editId ? 'Update Application' : 'Add Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;