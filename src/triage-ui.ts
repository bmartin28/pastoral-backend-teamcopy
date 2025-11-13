// Triage UI Component for Pastoral Care System

interface TriageItem {
  _id: string;
  graphMessageId: string;
  subject: string;
  from: string;
  receivedAt: string;
  confidence: number;
  status: 'New' | 'Reviewed' | 'Promoted' | 'Rejected' | 'Snoozed';
  extracted: {
    studentEmail?: string;
    names?: string[];
    programme?: string;
    tags?: string[];
    suggestedCaseAction?: 'Open' | 'Note' | 'Ignore';
  };
  bodyPreview: string;
}

class TriageManager {
  private apiBase: string = '/api/triage';
  private items: TriageItem[] = [];
  private selectedItem: TriageItem | null = null;

  async fetchItems(status?: string, minConfidence?: number): Promise<void> {
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (minConfidence) params.append('minConfidence', minConfidence.toString());

      const response = await fetch(`${this.apiBase}/items?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch triage items');
      
      this.items = await response.json();
      this.renderTable();
    } catch (error) {
      console.error('Error fetching triage items:', error);
      this.showError('Failed to load triage items');
    }
  }

  renderTable(): void {
    const tbody = document.querySelector('#triage-table tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (this.items.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No triage items found</td></tr>';
      return;
    }

    this.items.forEach(item => {
      const row = document.createElement('tr');
      row.dataset.itemId = item._id;
      
      const confidenceClass = item.confidence >= 0.75 ? 'high' : item.confidence >= 0.5 ? 'medium' : 'low';
      const statusClass = item.status.toLowerCase().replace(' ', '-');
      
      row.innerHTML = `
        <td>${new Date(item.receivedAt).toLocaleDateString()}</td>
        <td>${this.escapeHtml(item.from)}</td>
        <td>${this.escapeHtml(item.subject || '(No subject)')}</td>
        <td><span class="confidence-badge ${confidenceClass}">${(item.confidence * 100).toFixed(0)}%</span></td>
        <td>${item.extracted.studentEmail || item.extracted.names?.join(', ') || '-'}</td>
        <td>${item.extracted.suggestedCaseAction || '-'}</td>
        <td><span class="status-badge ${statusClass}">${item.status}</span></td>
      `;

      row.addEventListener('click', () => this.selectItem(item));
      tbody.appendChild(row);
    });
  }

  selectItem(item: TriageItem): void {
    this.selectedItem = item;
    this.renderDetail();
    
    // Highlight selected row
    document.querySelectorAll('#triage-table tbody tr').forEach(row => {
      row.classList.remove('selected');
    });
    const row = document.querySelector(`#triage-table tbody tr[data-item-id="${item._id}"]`);
    if (row) row.classList.add('selected');
  }

  renderDetail(): void {
    if (!this.selectedItem) return;

    const detailPanel = document.getElementById('triage-detail');
    if (!detailPanel) return;

    const item = this.selectedItem;
    const confidenceClass = item.confidence >= 0.75 ? 'high' : item.confidence >= 0.5 ? 'medium' : 'low';

    detailPanel.innerHTML = `
      <div class="triage-detail-header">
        <h3>${this.escapeHtml(item.subject || '(No subject)')}</h3>
        <span class="confidence-badge ${confidenceClass}">${(item.confidence * 100).toFixed(0)}% Confidence</span>
      </div>
      <div class="triage-detail-content">
        <div class="detail-section">
          <strong>From:</strong> ${this.escapeHtml(item.from)}
        </div>
        <div class="detail-section">
          <strong>Received:</strong> ${new Date(item.receivedAt).toLocaleString()}
        </div>
        <div class="detail-section">
          <strong>Status:</strong> <span class="status-badge ${item.status.toLowerCase()}">${item.status}</span>
        </div>
        ${item.extracted.studentEmail ? `
          <div class="detail-section">
            <strong>Student Email:</strong> ${this.escapeHtml(item.extracted.studentEmail)}
          </div>
        ` : ''}
        ${item.extracted.names && item.extracted.names.length > 0 ? `
          <div class="detail-section">
            <strong>Names:</strong> ${item.extracted.names.map(n => this.escapeHtml(n)).join(', ')}
          </div>
        ` : ''}
        ${item.extracted.programme ? `
          <div class="detail-section">
            <strong>Programme:</strong> ${this.escapeHtml(item.extracted.programme)}
          </div>
        ` : ''}
        ${item.extracted.tags && item.extracted.tags.length > 0 ? `
          <div class="detail-section">
            <strong>Tags:</strong> ${item.extracted.tags.map(t => `<span class="tag">${this.escapeHtml(t)}</span>`).join(' ')}
          </div>
        ` : ''}
        <div class="detail-section">
          <strong>Suggested Action:</strong> ${item.extracted.suggestedCaseAction || 'None'}
        </div>
        <div class="detail-section">
          <strong>Preview:</strong>
          <div class="body-preview">${this.escapeHtml(item.bodyPreview || 'No preview available')}</div>
        </div>
      </div>
      <div class="triage-detail-actions">
        <button class="action-button primary" id="promote-btn">Promote</button>
        <button class="action-button" id="reject-btn">Reject</button>
        <button class="action-button" id="snooze-btn">Snooze</button>
        <button class="action-button" id="review-btn">Mark Reviewed</button>
      </div>
    `;

    // Attach event listeners
    document.getElementById('promote-btn')?.addEventListener('click', () => this.promoteItem(item._id));
    document.getElementById('reject-btn')?.addEventListener('click', () => this.rejectItem(item._id));
    document.getElementById('snooze-btn')?.addEventListener('click', () => this.snoozeItem(item._id));
    document.getElementById('review-btn')?.addEventListener('click', () => this.reviewItem(item._id));
  }

  async promoteItem(itemId: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiBase}/items/${itemId}/promote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ createNewCase: true })
      });

      if (!response.ok) throw new Error('Failed to promote item');
      
      this.showSuccess('Item promoted successfully');
      await this.fetchItems();
      this.selectedItem = null;
      document.getElementById('triage-detail')!.innerHTML = '<p>Select an item to view details</p>';
    } catch (error) {
      console.error('Error promoting item:', error);
      this.showError('Failed to promote item');
    }
  }

  async rejectItem(itemId: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiBase}/items/${itemId}/reject`, {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Failed to reject item');
      
      this.showSuccess('Item rejected');
      await this.fetchItems();
      this.selectedItem = null;
      document.getElementById('triage-detail')!.innerHTML = '<p>Select an item to view details</p>';
    } catch (error) {
      console.error('Error rejecting item:', error);
      this.showError('Failed to reject item');
    }
  }

  async snoozeItem(itemId: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiBase}/items/${itemId}/snooze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snoozeUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() })
      });

      if (!response.ok) throw new Error('Failed to snooze item');
      
      this.showSuccess('Item snoozed');
      await this.fetchItems();
    } catch (error) {
      console.error('Error snoozing item:', error);
      this.showError('Failed to snooze item');
    }
  }

  async reviewItem(itemId: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiBase}/items/${itemId}/review`, {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Failed to mark as reviewed');
      
      this.showSuccess('Item marked as reviewed');
      await this.fetchItems();
    } catch (error) {
      console.error('Error reviewing item:', error);
      this.showError('Failed to mark as reviewed');
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private showError(message: string): void {
    // Simple error notification - can be enhanced
    alert(`Error: ${message}`);
  }

  private showSuccess(message: string): void {
    // Simple success notification - can be enhanced
    console.log(`Success: ${message}`);
  }
}

class TriageHandler implements DashboardComponent {
  private triageManager: TriageManager;
  private filterStatus: HTMLSelectElement | null = null;
  private filterConfidence: HTMLSelectElement | null = null;

  constructor() {
    this.triageManager = new TriageManager();
  }

  initialize(): void {
    // Set up filters
    this.filterStatus = document.getElementById('triage-status-filter') as HTMLSelectElement;
    this.filterConfidence = document.getElementById('triage-confidence-filter') as HTMLSelectElement;

    if (this.filterStatus) {
      this.filterStatus.addEventListener('change', () => this.applyFilters());
    }

    if (this.filterConfidence) {
      this.filterConfidence.addEventListener('change', () => this.applyFilters());
    }

    // Initial load
    this.triageManager.fetchItems();
  }

  private applyFilters(): void {
    const status = this.filterStatus?.value || undefined;
    const minConfidence = this.filterConfidence?.value ? parseFloat(this.filterConfidence.value) : undefined;
    this.triageManager.fetchItems(status, minConfidence);
  }
}

// Export for use in main dashboard
if (typeof window !== 'undefined') {
  (window as any).TriageHandler = TriageHandler;
}

