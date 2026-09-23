import { useEffect, useState, useMemo } from "react";
import TicketForm from "./TicketForm";

const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const API_BASE = rawApiUrl.replace(/\/+$/, "");

function App() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [priorityFilter, setPriorityFilter] = useState("all");
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [newNoteText, setNewNoteText] = useState("");
    const [noteAuthor, setNoteAuthor] = useState("Support Agent");
    const [addingNote, setAddingNote] = useState(false);
    const [toast, setToast] = useState(null);
    const [seeding, setSeeding] = useState(false);

    // Show temporary toast message
    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    // Fetch all tickets from backend API
    const fetchTickets = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/tickets`);
            if (!response.ok) throw new Error("Failed to fetch tickets");
            const data = await response.json();
            setTickets(data);

            if (selectedTicket) {
                const updatedSelected = data.find(
                    (t) => (t._id && t._id === selectedTicket._id) || (t.ticketId && t.ticketId === selectedTicket.ticketId)
                );
                if (updatedSelected) setSelectedTicket(updatedSelected);
            }
        } catch (error) {
            console.error("Error fetching tickets:", error);
            showToast("Failed to load tickets. Backend service unreachable.", "error");
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    // Quick Status Update
    const updateTicketStatus = async (ticketId, newStatus) => {
        try {
            const response = await fetch(`${API_BASE}/tickets/${ticketId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) throw new Error("Status update failed");
            await response.json();

            showToast(`Status updated to ${newStatus}`);
            fetchTickets(true);

            if (selectedTicket && (selectedTicket._id === ticketId || selectedTicket.ticketId === ticketId)) {
                setSelectedTicket((prev) => ({ ...prev, status: newStatus }));
            }
        } catch (error) {
            console.error("Error updating status:", error);
            showToast("Could not update status", "error");
        }
    };

    // Quick Priority Update
    const updateTicketPriority = async (ticketId, newPriority) => {
        try {
            const response = await fetch(`${API_BASE}/tickets/${ticketId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ priority: newPriority })
            });

            if (!response.ok) throw new Error("Priority update failed");
            showToast(`Priority updated to ${newPriority}`);
            fetchTickets(true);

            if (selectedTicket && (selectedTicket._id === ticketId || selectedTicket.ticketId === ticketId)) {
                setSelectedTicket((prev) => ({ ...prev, priority: newPriority }));
            }
        } catch (error) {
            console.error("Error updating priority:", error);
            showToast("Could not update priority", "error");
        }
    };

    // Add Note to ticket
    const handleAddNote = async (e) => {
        e.preventDefault();
        if (!newNoteText.trim() || !selectedTicket) return;

        setAddingNote(true);
        try {
            const identifier = selectedTicket.ticketId || selectedTicket._id;
            const response = await fetch(`${API_BASE}/tickets/${identifier}/notes`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    noteText: newNoteText.trim(),
                    author: noteAuthor.trim() || "Support Agent"
                })
            });

            if (!response.ok) throw new Error("Failed to post note");
            const data = await response.json();

            setNewNoteText("");
            showToast("Internal note logged");
            setSelectedTicket(data.ticket);
            fetchTickets(true);
        } catch (error) {
            console.error("Error adding note:", error);
            showToast("Failed to record note", "error");
        } finally {
            setAddingNote(false);
        }
    };

    // Delete ticket
    const handleDeleteTicket = async (ticketId) => {
        if (!window.confirm("Are you sure you want to permanently delete this ticket?")) return;

        try {
            const response = await fetch(`${API_BASE}/tickets/${ticketId}`, {
                method: "DELETE"
            });

            if (!response.ok) throw new Error("Failed to delete ticket");

            showToast("Ticket deleted successfully");
            setSelectedTicket(null);
            fetchTickets();
        } catch (error) {
            console.error("Error deleting ticket:", error);
            showToast("Could not delete ticket", "error");
        }
    };

    // Seed sample tickets
    const handleSeedData = async () => {
        setSeeding(true);
        try {
            const response = await fetch(`${API_BASE}/tickets/seed`, {
                method: "POST"
            });
            if (!response.ok) throw new Error("Seeding failed");
            const data = await response.json();
            showToast(data.message || "Sample tickets populated");
            fetchTickets();
        } catch (error) {
            console.error("Error seeding tickets:", error);
            showToast("Could not populate sample data", "error");
        } finally {
            setSeeding(false);
        }
    };

    // Format dates nicely
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    // Helper to get normalized status
    const getCleanStatus = (status) => {
        if (!status) return "Open";
        const s = status.toLowerCase();
        if (s === "open") return "Open";
        if (s === "in-progress" || s === "in progress") return "In Progress";
        if (s === "resolved" || s === "closed") return "Closed";
        return status;
    };

    // Filter tickets in memory
    const filteredTickets = useMemo(() => {
        return tickets.filter((ticket) => {
            const cleanStatus = getCleanStatus(ticket.status);

            const matchesStatus =
                statusFilter === "all" || cleanStatus.toLowerCase() === statusFilter.toLowerCase();

            const matchesPriority =
                priorityFilter === "all" || (ticket.priority && ticket.priority.toLowerCase() === priorityFilter.toLowerCase());

            const searchLower = searchTerm.toLowerCase().trim();
            const matchesSearch =
                !searchLower ||
                (ticket.ticketId && ticket.ticketId.toLowerCase().includes(searchLower)) ||
                (ticket.subject && ticket.subject.toLowerCase().includes(searchLower)) ||
                (ticket.customerName && ticket.customerName.toLowerCase().includes(searchLower)) ||
                (ticket.customerEmail && ticket.customerEmail.toLowerCase().includes(searchLower)) ||
                (ticket.description && ticket.description.toLowerCase().includes(searchLower));

            return matchesStatus && matchesPriority && matchesSearch;
        });
    }, [tickets, statusFilter, priorityFilter, searchTerm]);

    // Ticket metrics counts
    const totalCount = tickets.length;
    const openCount = tickets.filter((t) => getCleanStatus(t.status) === "Open").length;
    const inProgressCount = tickets.filter((t) => getCleanStatus(t.status) === "In Progress").length;
    const closedCount = tickets.filter((t) => getCleanStatus(t.status) === "Closed").length;

    return (
        <div className="crm-container">
            {/* Toast Notification Alert */}
            {toast && (
                <div className={`toast-notification ${toast.type}`}>
                    {toast.type === "error" ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="15" y1="9" x2="9" y2="15"></line>
                            <line x1="9" y1="9" x2="15" y2="15"></line>
                        </svg>
                    ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    )}
                    <span>{toast.message}</span>
                </div>
            )}

            {/* Navigation Header */}
            <header className="crm-header">
                <div className="brand-group">
                    <div className="brand-logo-icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                    </div>
                    <div>
                        <h1 className="brand-title">Customer Support CRM</h1>
                        <p className="brand-sub">Ticket Operations & SLA Triage Desk</p>
                    </div>
                </div>

                <div className="header-actions">
                    <button
                        className="btn btn-outline"
                        onClick={handleSeedData}
                        disabled={seeding}
                    >
                        {seeding ? "Populating..." : "Populate Demo Data"}
                    </button>
                    <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        <span>New Ticket</span>
                    </button>
                </div>
            </header>

            {/* Modal Dialog for Creating Ticket */}
            {showForm && (
                <TicketForm
                    onClose={() => setShowForm(false)}
                    onTicketCreated={(newTicket) => {
                        showToast(`Ticket ${newTicket.ticketId || ""} created successfully`);
                        fetchTickets();
                    }}
                />
            )}

            {/* ======================================================== */}
            {/* TICKET DETAILS VIEW */}
            {/* ======================================================== */}
            {selectedTicket ? (
                <div className="ticket-detail-view">
                    <div className="detail-top-nav">
                        <button className="btn btn-outline" onClick={() => setSelectedTicket(null)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="19" y1="12" x2="5" y2="12"></line>
                                <polyline points="12 19 5 12 12 5"></polyline>
                            </svg>
                            <span>Back to All Tickets</span>
                        </button>

                        <div className="detail-nav-actions">
                            <span className="detail-ticket-id">
                                {selectedTicket.ticketId || `TKT-${selectedTicket._id.slice(-4)}`}
                            </span>
                            <button
                                className="btn btn-danger-outline"
                                onClick={() => handleDeleteTicket(selectedTicket._id)}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                                <span>Delete Ticket</span>
                            </button>
                        </div>
                    </div>

                    <div className="detail-layout">
                        {/* Main Issue Content */}
                        <div className="detail-main">
                            <div className="detail-card">
                                <div className="detail-subject-header">
                                    <h2 className="detail-subject">{selectedTicket.subject}</h2>
                                    <div className="detail-badges">
                                        <span className={`badge-pill badge-${getCleanStatus(selectedTicket.status).toLowerCase().replace(/\s+/g, "-")}`}>
                                            <span className="status-dot"></span>
                                            {getCleanStatus(selectedTicket.status)}
                                        </span>
                                        <span className={`badge-priority badge-p-${(selectedTicket.priority || "Medium").toLowerCase()}`}>
                                            {selectedTicket.priority || "Medium"} Priority
                                        </span>
                                    </div>
                                </div>

                                <div className="detail-desc-box">
                                    <h4>Description</h4>
                                    <p>{selectedTicket.description}</p>
                                </div>

                                <div className="detail-meta-grid">
                                    <div>
                                        <span className="meta-label">Submitted</span>
                                        <p className="meta-val">{formatDate(selectedTicket.createdAt)}</p>
                                    </div>
                                    <div>
                                        <span className="meta-label">Last Modified</span>
                                        <p className="meta-val">{formatDate(selectedTicket.updatedAt)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Internal Notes / Agent Collaboration Thread */}
                            <div className="detail-card notes-section">
                                <div className="notes-header">
                                    <div>
                                        <h3>Internal Activity & Notes</h3>
                                        <p className="notes-sub">Team collaboration and incident timeline</p>
                                    </div>
                                    <span className="notes-count">
                                        {(selectedTicket.notes && selectedTicket.notes.length) || 0} entries
                                    </span>
                                </div>

                                <div className="notes-timeline">
                                    {selectedTicket.notes && selectedTicket.notes.length > 0 ? (
                                        selectedTicket.notes.map((note, idx) => (
                                            <div className="note-card" key={note._id || idx}>
                                                <div className="note-meta">
                                                    <span className="note-author">{note.author || "Support Agent"}</span>
                                                    <span className="note-time">{formatDate(note.createdAt)}</span>
                                                </div>
                                                <p className="note-text">{note.noteText}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="empty-notes-hint">
                                            No internal activity logged yet. Add troubleshooting notes or status remarks below.
                                        </p>
                                    )}
                                </div>

                                <form onSubmit={handleAddNote} className="add-note-form">
                                    <div className="note-author-input">
                                        <label>Author:</label>
                                        <input
                                            type="text"
                                            value={noteAuthor}
                                            onChange={(e) => setNoteAuthor(e.target.value)}
                                            placeholder="Agent Name or Role"
                                        />
                                    </div>
                                    <textarea
                                        rows={3}
                                        placeholder="Add an internal progress note or resolution detail..."
                                        value={newNoteText}
                                        onChange={(e) => setNewNoteText(e.target.value)}
                                        required
                                    ></textarea>
                                    <div className="note-form-actions">
                                        <button type="submit" className="btn btn-primary" disabled={addingNote}>
                                            {addingNote ? "Saving..." : "Add Internal Note"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* Sidebar: Customer Info & Status Controls */}
                        <div className="detail-sidebar">
                            <div className="sidebar-card">
                                <h3>Quick Actions</h3>

                                <div className="sidebar-field">
                                    <label>Status</label>
                                    <select
                                        className="form-select"
                                        value={getCleanStatus(selectedTicket.status)}
                                        onChange={(e) =>
                                            updateTicketStatus(selectedTicket._id, e.target.value)
                                        }
                                    >
                                        <option value="Open">Open</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Closed">Closed</option>
                                    </select>
                                </div>

                                <div className="sidebar-field">
                                    <label>Priority</label>
                                    <select
                                        className="form-select"
                                        value={selectedTicket.priority || "Medium"}
                                        onChange={(e) =>
                                            updateTicketPriority(selectedTicket._id, e.target.value)
                                        }
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                        <option value="Urgent">Urgent</option>
                                    </select>
                                </div>
                            </div>

                            <div className="sidebar-card">
                                <h3>Customer Information</h3>
                                <div className="customer-info-box">
                                    <div className="customer-avatar">
                                        {selectedTicket.customerName ? selectedTicket.customerName.charAt(0).toUpperCase() : "C"}
                                    </div>
                                    <div>
                                        <p className="cust-name">{selectedTicket.customerName}</p>
                                        <a href={`mailto:${selectedTicket.customerEmail}`} className="cust-email">
                                            {selectedTicket.customerEmail}
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* ======================================================== */
                /* MAIN DASHBOARD: STATS, SEARCH & LIST VIEW */
                /* ======================================================== */
                <>
                    {/* Interactive KPI Stat Cards */}
                    <section className="stats-row">
                        <div
                            className={`kpi-card ${statusFilter === "all" ? "active-kpi" : ""}`}
                            onClick={() => setStatusFilter("all")}
                        >
                            <div className="kpi-info">
                                <span className="kpi-label">All Tickets</span>
                                <span className="kpi-num">{totalCount}</span>
                            </div>
                            <div className="kpi-pill-indicator">Total</div>
                        </div>

                        <div
                            className={`kpi-card ${statusFilter === "Open" ? "active-kpi" : ""}`}
                            onClick={() => setStatusFilter(statusFilter === "Open" ? "all" : "Open")}
                        >
                            <div className="kpi-info">
                                <span className="kpi-label">Open</span>
                                <span className="kpi-num color-open">{openCount}</span>
                            </div>
                            <div className="kpi-pill-indicator indicator-open">Pending</div>
                        </div>

                        <div
                            className={`kpi-card ${statusFilter === "In Progress" ? "active-kpi" : ""}`}
                            onClick={() => setStatusFilter(statusFilter === "In Progress" ? "all" : "In Progress")}
                        >
                            <div className="kpi-info">
                                <span className="kpi-label">In Progress</span>
                                <span className="kpi-num color-progress">{inProgressCount}</span>
                            </div>
                            <div className="kpi-pill-indicator indicator-progress">Active</div>
                        </div>

                        <div
                            className={`kpi-card ${statusFilter === "Closed" ? "active-kpi" : ""}`}
                            onClick={() => setStatusFilter(statusFilter === "Closed" ? "all" : "Closed")}
                        >
                            <div className="kpi-info">
                                <span className="kpi-label">Closed</span>
                                <span className="kpi-num color-closed">{closedCount}</span>
                            </div>
                            <div className="kpi-pill-indicator indicator-closed">Resolved</div>
                        </div>
                    </section>

                    {/* Filter and Search Controls */}
                    <section className="controls-bar">
                        <div className="search-wrap">
                            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Search by ID, customer name, email, subject, or keywords..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button className="clear-search-btn" onClick={() => setSearchTerm("")} aria-label="Clear search">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            )}
                        </div>

                        <div className="dropdown-filters">
                            <div className="filter-group">
                                <label>Status</label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="filter-select"
                                >
                                    <option value="all">All</option>
                                    <option value="Open">Open</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Closed">Closed</option>
                                </select>
                            </div>

                            <div className="filter-group">
                                <label>Priority</label>
                                <select
                                    value={priorityFilter}
                                    onChange={(e) => setPriorityFilter(e.target.value)}
                                    className="filter-select"
                                >
                                    <option value="all">All</option>
                                    <option value="Urgent">Urgent</option>
                                    <option value="High">High</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Low">Low</option>
                                </select>
                            </div>
                        </div>
                    </section>

                    {/* Ticket List Section */}
                    <section className="tickets-container">
                        <div className="tickets-section-header">
                            <h2>
                                Tickets <span className="result-badge">({filteredTickets.length})</span>
                            </h2>
                            {(searchTerm || statusFilter !== "all" || priorityFilter !== "all") && (
                                <button
                                    className="btn-text-reset"
                                    onClick={() => {
                                        setSearchTerm("");
                                        setStatusFilter("all");
                                        setPriorityFilter("all");
                                    }}
                                >
                                    Clear Filters
                                </button>
                            )}
                        </div>

                        {loading ? (
                            <div className="loading-state">
                                <div className="spinner"></div>
                                <p>Connecting to database...</p>
                            </div>
                        ) : filteredTickets.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon-wrap">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                                    </svg>
                                </div>
                                <h3>No matching tickets</h3>
                                <p>
                                    {searchTerm || statusFilter !== "all" || priorityFilter !== "all"
                                        ? "No tickets match your active filter criteria."
                                        : "Create your first support ticket or populate sample data to begin."}
                                </p>
                                {tickets.length === 0 && (
                                    <div className="empty-state-actions">
                                        <button className="btn btn-outline" onClick={handleSeedData}>
                                            Populate Sample Data
                                        </button>
                                        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                                            Create Ticket
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="ticket-list">
                                {filteredTickets.map((ticket) => {
                                    const cleanStatus = getCleanStatus(ticket.status);
                                    const ticketIdDisplay =
                                        ticket.ticketId || `TKT-${ticket._id.slice(-4)}`;

                                    return (
                                        <div
                                            key={ticket._id}
                                            className="ticket-row-card"
                                            onClick={() => setSelectedTicket(ticket)}
                                        >
                                            <div className="ticket-row-left">
                                                <div className="ticket-id-tag">{ticketIdDisplay}</div>
                                                <div className="ticket-info">
                                                    <h3 className="ticket-subject">{ticket.subject}</h3>
                                                    <div className="ticket-customer-line">
                                                        <span className="customer-name-bold">
                                                            {ticket.customerName}
                                                        </span>
                                                        <span className="customer-dot">•</span>
                                                        <span className="customer-email-muted">
                                                            {ticket.customerEmail}
                                                        </span>
                                                        <span className="customer-dot">•</span>
                                                        <span className="ticket-date-muted">
                                                            {formatDate(ticket.createdAt)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div
                                                className="ticket-row-right"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <span
                                                    className={`badge-priority badge-p-${(ticket.priority || "Medium").toLowerCase()}`}
                                                >
                                                    {ticket.priority || "Medium"}
                                                </span>

                                                <select
                                                    className={`status-select-pill status-${cleanStatus.toLowerCase().replace(/\s+/g, "-")}`}
                                                    value={cleanStatus}
                                                    onChange={(e) =>
                                                        updateTicketStatus(ticket._id, e.target.value)
                                                    }
                                                >
                                                    <option value="Open">Open</option>
                                                    <option value="In Progress">In Progress</option>
                                                    <option value="Closed">Closed</option>
                                                </select>

                                                <svg className="row-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="9 18 15 12 9 6"></polyline>
                                                </svg>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}

export default App;