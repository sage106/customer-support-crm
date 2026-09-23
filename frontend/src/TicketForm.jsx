import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function TicketForm({ onClose, onTicketCreated }) {
    const [customerName, setCustomerName] = useState("");
    const [customerEmail, setCustomerEmail] = useState("");
    const [subject, setSubject] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState("Medium");
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg("");

        if (!customerName.trim() || !customerEmail.trim() || !subject.trim() || !description.trim()) {
            setErrorMsg("All required fields must be completed.");
            return;
        }

        const ticketData = {
            customerName: customerName.trim(),
            customerEmail: customerEmail.trim(),
            subject: subject.trim(),
            description: description.trim(),
            priority,
            status: "Open"
        };

        setSubmitting(true);
        try {
            const response = await fetch(`${API_BASE}/tickets`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(ticketData)
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || "Failed to create ticket");
            }

            const data = await response.json();
            onTicketCreated(data.ticket || data);
            onClose();
        } catch (error) {
            console.error("Error creating ticket:", error);
            setErrorMsg(error.message || "Service unavailable. Verify backend connection.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-title-wrap">
                        <h2>New Support Ticket</h2>
                        <p className="modal-subtitle">Log a new customer request or operational issue</p>
                    </div>
                    <button className="modal-close-btn" onClick={onClose} aria-label="Close dialog">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                {errorMsg && (
                    <div className="error-alert">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <span>{errorMsg}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="ticket-form">
                    <div className="form-row">
                        <div className="form-group flex-1">
                            <label htmlFor="customerName">
                                Customer Name <span className="required-star">*</span>
                            </label>
                            <input
                                id="customerName"
                                type="text"
                                placeholder="Full Name"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group flex-1">
                            <label htmlFor="customerEmail">
                                Email Address <span className="required-star">*</span>
                            </label>
                            <input
                                id="customerEmail"
                                type="email"
                                placeholder="name@domain.com"
                                value={customerEmail}
                                onChange={(e) => setCustomerEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group flex-2">
                            <label htmlFor="subject">
                                Subject <span className="required-star">*</span>
                            </label>
                            <input
                                id="subject"
                                type="text"
                                placeholder="Brief summary of the issue"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group flex-1">
                            <label htmlFor="priority">Priority</label>
                            <select
                                id="priority"
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                                className="form-select"
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Urgent">Urgent</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">
                            Description <span className="required-star">*</span>
                        </label>
                        <textarea
                            id="description"
                            rows={4}
                            placeholder="Detailed explanation, reproduction steps, or context..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        ></textarea>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting ? "Submitting..." : "Create Ticket"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default TicketForm;