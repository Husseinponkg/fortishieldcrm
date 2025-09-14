// public/js/report.js
// Client logic for listing, creating, and downloading reports
(function () {
    const apiBase = '/report';

    async function fetchJson(url, options) {
        try {
            const res = await fetch(url, options);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error('Request failed', url, err);
            throw err;
        }
    }

    async function loadReports() {
        try {
            // API might return either an array or { success: true, data: [] }
            const raw = await fetchJson(apiBase);
            const data = Array.isArray(raw) ? raw : (raw && raw.data) ? raw.data : [];
            const list = document.getElementById('reportsList');
            if (!list) return;
            list.innerHTML = '';
            if (data.length === 0) {
                list.textContent = 'No reports found.';
                return;
            }
            data.forEach(r => {
                const card = document.createElement('div');
                card.className = 'report-card';
                const created = r.created_at ? new Date(r.created_at).toLocaleString() : '';
                card.innerHTML = `\n                    <h4>${escapeHtml(r.title) || 'Untitled'}</h4>\n                    <p><strong>Type:</strong> ${escapeHtml(r.task_type) || ''} &nbsp; <strong>Status:</strong> ${escapeHtml(r.task_status) || ''}</p>\n                    <p>${escapeHtml((r.description || '').slice(0, 200))}</p>\n                    <p><small>Created: ${created}</small></p>\n                    <div class="report-actions">\n                        <a href="${apiBase}/download/${encodeURIComponent(r.report_id)}" class="btn">Download</a>\n                    </div>\n                `;
                // add delete button after card is in DOM to attach handler
                list.appendChild(card);
                const actions = card.querySelector('.report-actions');
                if (actions) {
                    const del = document.createElement('button');
                    del.textContent = 'Delete';
                    del.className = 'btn';
                    del.style.marginLeft = '8px';
                    del.addEventListener('click', async () => {
                        if (!confirm('Delete this report?')) return;
                        await deleteReport(r.report_id);
                    });
                    actions.appendChild(del);
                }
            });
        } catch (err) {
            console.error('Failed to load reports', err);
        }
    }

    // small helper to avoid injecting raw HTML
    function escapeHtml(input) {
        if (!input && input !== 0) return '';
        return String(input).replace(/[&<>"'`]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;', '`':'&#96;'}[s]));
    }

    async function loadSelects() {
        try {
            const customers = await fetchJson(`${apiBase}/customers`);
            const projects = await fetchJson(`${apiBase}/projects`);

            const custSel = document.getElementById('customer_id');
            const projSel = document.getElementById('project_id');
            if (custSel) {
                custSel.innerHTML = '<option value="">-- choose --</option>' + customers.map(c => `<option value="${c.id}">${c.username}</option>`).join('');
            }
            if (projSel) {
                projSel.innerHTML = '<option value="">-- choose --</option>' + projects.map(p => `<option value="${p.id}">${p.title}</option>`).join('');
            }
        } catch (err) {
            console.error('Failed to load selects', err);
        }
    }

    async function submitForm(e) {
        e && e.preventDefault();
        const form = document.getElementById('reportForm');
        if (!form) return;

        const data = {
            title: (document.getElementById('title')||{}).value || '',
            task_type: (document.getElementById('task_type')||{}).value || '',
            task_status: (document.getElementById('task_status')||{}).value || 'pending',
            description: (document.getElementById('description')||{}).value || '',
            file_extension: (document.getElementById('file_extension')||{}).value || 'pdf',
            signature: (document.getElementById('signature')||{}).value || '',
            customer_id: (document.getElementById('customer_id')||{}).value || null,
            project_id: (document.getElementById('project_id')||{}).value || null,
            created_by: (document.getElementById('created_by')||{}).value || null
        };

        try {
            const res = await fetch(`${apiBase}/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({ message: 'unknown' }));
                throw new Error(err.message || 'Failed to create report');
            }

            const result = await res.json();
            // reload list
            await loadReports();
            if (typeof showAlert === 'function') showAlert('Report created', 'success');
            form.reset();
        } catch (err) {
            console.error('Create report failed', err);
            if (typeof showAlert === 'function') showAlert('Failed to create report: ' + (err.message||''), 'danger');
        }
    }

    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        loadReports();
        loadSelects();
        const form = document.getElementById('reportForm');
        if (form) form.addEventListener('submit', submitForm);
    });

    // Expose for manual refresh/testing
    window.loadReports = loadReports;
    
    async function deleteReport(id) {
        try {
            const res = await fetch(`${apiBase}/${encodeURIComponent(id)}`, { method: 'DELETE' });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.message || 'Delete failed');
            }
            if (typeof showAlert === 'function') showAlert('Report deleted', 'success');
            await loadReports();
        } catch (err) {
            console.error('Delete failed', err);
            if (typeof showAlert === 'function') showAlert('Failed to delete report: ' + (err.message||''), 'danger');
        }
    }
})();
