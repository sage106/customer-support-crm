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
            setErrorMsg("Please fill in all required fields.");
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
            setErrorMsg(error.message || "Network error. Please make sure the backend server is running.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-title-wrap">
                        <span className="modal-icon">🎫</span>
                        <div>
                            <h2>Create New Support Ticket</h2>
                            <p className="modal-subtitle">Log an incoming customer inquiry or support incident</p>
                        </div>
                    </div>
                    <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
                        ✕
                    </button>
                </div>

                {errorMsg && (
                    <div className="error-alert">
                        <span>⚠️</span> {errorMsg}
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
                                placeholder="e.g. Jane Doe"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group flex-1">
                            <label htmlFor="customerEmail">
                                Customer Email <span className="required-star">*</span>
                            </label>
                            <input
                                id="customerEmail"
                                type="email"
                                placeholder="e.g. jane@company.com"
                                value={customerEmail}
                                onChange={(e) => setCustomerEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group flex-2">
                            <label htmlFor="subject">
                                Subject / Issue Title <span className="required-star">*</span>
                            </label>
                            <input
                                id="subject"
                                type="text"
                                placeholder="e.g. Payment webhook failing on production"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group flex-1">
                            <label htmlFor="priority">Priority Level</label>
                            <select
                                id="priority"
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                                className={`priority-select priority-${priority.toLowerCase()}`}
                            >
                                <option value="Low">🟢 Low</option>
                                <option value="Medium">🔵 Medium</option>
                                <option value="High">🟠 High</option>
                                <option value="Urgent">🔴 Urgent</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">
                            Issue Description <span className="required-star">*</span>
                        </label>
                        <textarea
                            id="description"
                            rows={4}
                            placeholder="Provide details about the issue, steps to reproduce, or relevant context..."
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
                            {submitting ? "Creating..." : "Create Ticket"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default TicketForm;