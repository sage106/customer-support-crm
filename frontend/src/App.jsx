import { useEffect, useState, useMemo } from "react";
import TicketForm from "./TicketForm";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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

            // If a ticket is currently selected in detail view, update its data
            if (selectedTicket) {
                const updatedSelected = data.find(
                    (t) => (t._id && t._id === selectedTicket._id) || (t.ticketId && t.ticketId === selectedTicket.ticketId)
                );
                if (updatedSelected) setSelectedTicket(updatedSelected);
            }
        } catch (error) {
            console.error("Error fetching tickets:", error);
            showToast("Failed to load tickets. Is backend running?", "error");
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
            const result = await response.json();

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
            showToast("Failed to add note", "error");
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
            showToast(data.message || "Sample tickets loaded!");
            fetchTickets();
        } catch (error) {
            console.error("Error seeding tickets:", error);
            showToast("Could not seed data", "error");
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
                    <span>{toast.type === "error" ? "❌" : "✅"}</span>
                    <span>{toast.message}</span>
                </div>
            )}

            {/* Navigation Header */}
            <header className="crm-header">
                <div className="brand-group">
                    <div className="brand-icon">🎫</div>
                    <div>
                        <h1 className="brand-title">Support Desk CRM</h1>
                        <p className="brand-sub">Customer Tickets & Incident Management</p>
                    </div>
                </div>

                <div className="header-actions">
                    <button
                        className="btn btn-outline"
                        onClick={handleSeedData}
                        disabled={seeding}
                        title="Add 5 sample tickets for testing"
                    >
                        {seeding ? "Loading..." : "⚡ Load Demo Data"}
                    </button>
                    <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                        + New Ticket
                    </button>
                </div>
            </header>

            {/* Modal Dialog for Creating Ticket */}
            {showForm && (
                <TicketForm
                    onClose={() => setShowForm(false)}
                    onTicketCreated={(newTicket) => {
                        showToast(`Ticket ${newTicket.ticketId || ""} created successfully!`);
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
                            ← Back to Tickets
                        </button>

                        <div className="detail-nav-actions">
                            <span className="detail-ticket-id">
                                {selectedTicket.ticketId || `TKT-${selectedTicket._id.slice(-4)}`}
                            </span>
                            <button
                                className="btn btn-danger-outline"
                                onClick={() => handleDeleteTicket(selectedTicket._id)}
                            >
                                🗑️ Delete Ticket
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
                                            {getCleanStatus(selectedTicket.status)}
                                        </span>
                                        <span className={`badge-priority badge-p-${(selectedTicket.priority || "Medium").toLowerCase()}`}>
                                            {(selectedTicket.priority || "Medium")} Priority
                                        </span>
                                    </div>
                                </div>

                                <div className="detail-desc-box">
                                    <h4>Description</h4>
                                    <p>{selectedTicket.description}</p>
                                </div>

                                <div className="detail-meta-grid">
                                    <div>
                                        <span className="meta-label">Submitted On</span>
                                        <p className="meta-val">{formatDate(selectedTicket.createdAt)}</p>
                                    </div>
                                    <div>
                                        <span className="meta-label">Last Activity</span>
                                        <p className="meta-val">{formatDate(selectedTicket.updatedAt)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Internal Notes / Agent Collaboration Thread */}
                            <div className="detail-card notes-section">
                                <div className="notes-header">
                                    <h3>💬 Internal Activity & Notes</h3>
                                    <span className="notes-count">
                                        {(selectedTicket.notes && selectedTicket.notes.length) || 0} notes
                                    </span>
                                </div>

                                <div className="notes-timeline">
                                    {selectedTicket.notes && selectedTicket.notes.length > 0 ? (
                                        selectedTicket.notes.map((note, idx) => (
                                            <div className="note-card" key={note._id || idx}>
                                                <div className="note-meta">
                                                    <span className="note-author">👤 {note.author || "Support Agent"}</span>
                                                    <span className="note-time">{formatDate(note.createdAt)}</span>
                                                </div>
                                                <p className="note-text">{note.noteText}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="empty-notes-hint">
                                            No internal notes recorded yet. Add an update or troubleshooting step below.
                                        </p>
                                    )}
                                </div>

                                <form onSubmit={handleAddNote} className="add-note-form">
                                    <div className="note-author-input">
                                        <label>Logged By:</label>
                                        <input
                                            type="text"
                                            value={noteAuthor}
                                            onChange={(e) => setNoteAuthor(e.target.value)}
                                            placeholder="Your Name / Team"
                                        />
                                    </div>
                                    <textarea
                                        rows={3}
                                        placeholder="Add an internal progress note, debugging findings, or customer response..."
                                        value={newNoteText}
                                        onChange={(e) => setNewNoteText(e.target.value)}
                                        required
                                    ></textarea>
                                    <div className="note-form-actions">
                                        <button type="submit" className="btn btn-primary" disabled={addingNote}>
                                            {addingNote ? "Adding Note..." : "Post Internal Note"}
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
                                    <label>Ticket Status</label>
                                    <select
                                        className="form-select status-changer"
                                        value={getCleanStatus(selectedTicket.status)}
                                        onChange={(e) =>
                                            updateTicketStatus(selectedTicket._id, e.target.value)
                                        }
                                    >
                                        <option value="Open">🟡 Open</option>
                                        <option value="In Progress">🔵 In Progress</option>
                                        <option value="Closed">🟢 Closed</option>
                                    </select>
                                </div>

                                <div className="sidebar-field">
                                    <label>Urgency Priority</label>
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
                                <h3>Customer Profile</h3>
                                <div className="customer-info-box">
                                    <div className="customer-avatar">
                                        {selectedTicket.customerName ? selectedTicket.customerName.charAt(0).toUpperCase() : "C"}
                                    </div>
                                    <div>
                                        <p className="cust-name">{selectedTicket.customerName}</p>
                                        <a href={`mailto:${selectedTicket.customerEmail}`} className="cust-email">
                                            ✉️ {selectedTicket.customerEmail}
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
                            title="Click to view all tickets"
                        >
                            <div className="kpi-info">
                                <span className="kpi-label">Total Tickets</span>
                                <span className="kpi-num">{totalCount}</span>
                            </div>
                            <span className="kpi-icon">📋</span>
                        </div>

                        <div
                            className={`kpi-card ${statusFilter === "Open" ? "active-kpi" : ""}`}
                            onClick={() => setStatusFilter(statusFilter === "Open" ? "all" : "Open")}
                            title="Click to filter Open tickets"
                        >
                            <div className="kpi-info">
                                <span className="kpi-label">Open</span>
                                <span className="kpi-num color-open">{openCount}</span>
                            </div>
                            <span className="kpi-icon">🟡</span>
                        </div>

                        <div
                            className={`kpi-card ${statusFilter === "In Progress" ? "active-kpi" : ""}`}
                            onClick={() => setStatusFilter(statusFilter === "In Progress" ? "all" : "In Progress")}
                            title="Click to filter In Progress tickets"
                        >
                            <div className="kpi-info">
                                <span className="kpi-label">In Progress</span>
                                <span className="kpi-num color-progress">{inProgressCount}</span>
                            </div>
                            <span className="kpi-icon">🔵</span>
                        </div>

                        <div
                            className={`kpi-card ${statusFilter === "Closed" ? "active-kpi" : ""}`}
                            onClick={() => setStatusFilter(statusFilter === "Closed" ? "all" : "Closed")}
                            title="Click to filter Closed tickets"
                        >
                            <div className="kpi-info">
                                <span className="kpi-label">Closed</span>
                                <span className="kpi-num color-closed">{closedCount}</span>
                            </div>
                            <span className="kpi-icon">🟢</span>
                        </div>
                    </section>

                    {/* Filter and Search Controls */}
                    <section className="controls-bar">
                        <div className="search-wrap">
                            <span className="search-icon">🔍</span>
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Search by ticket ID, subject, customer, email, or description..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button className="clear-search-btn" onClick={() => setSearchTerm("")}>
                                    ✕
                                </button>
                            )}
                        </div>

                        <div className="dropdown-filters">
                            <div className="filter-group">
                                <label>Status:</label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="filter-select"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="Open">Open</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Closed">Closed</option>
                                </select>
                            </div>

                            <div className="filter-group">
                                <label>Priority:</label>
                                <select
                                    value={priorityFilter}
                                    onChange={(e) => setPriorityFilter(e.target.value)}
                                    className="filter-select"
                                >
                                    <option value="all">All Priorities</option>
                                    <option value="Urgent">Urgent</option>
                                    <option value="High">High</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Low">Low</option>
                                </select>
                            </div>
                        </div>
                    </section>

                    {/* Ticket List / Table */}
                    <section className="tickets-container">
                        <div className="tickets-section-header">
                            <h2>
                                Support Tickets{" "}
                                <span className="result-badge">({filteredTickets.length})</span>
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
                                    Reset Filters
                                </button>
                            )}
                        </div>

                        {loading ? (
                            <div className="loading-state">
                                <div className="spinner"></div>
                                <p>Loading tickets from database...</p>
                            </div>
                        ) : filteredTickets.length === 0 ? (
                            <div className="empty-state">
                                <span className="empty-icon">📂</span>
                                <h3>No tickets found</h3>
                                <p>
                                    {searchTerm || statusFilter !== "all" || priorityFilter !== "all"
                                        ? "Try adjusting your search terms or filters."
                                        : "Get started by creating your first customer support ticket or loading demo data."}
                                </p>
                                {tickets.length === 0 && (
                                    <div className="empty-state-actions">
                                        <button className="btn btn-outline" onClick={handleSeedData}>
                                            Load Sample Tickets
                                        </button>
                                        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                                            + Create Ticket
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
                                                {/* Priority badge */}
                                                <span
                                                    className={`badge-priority badge-p-${(ticket.priority || "Medium").toLowerCase()}`}
                                                >
                                                    {ticket.priority || "Medium"}
                                                </span>

                                                {/* Status dropdown selector */}
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

                                                <span className="row-arrow">→</span>
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