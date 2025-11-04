// TypeScript code for Pastoral Care System

interface DashboardComponent {
    initialize(): void;
}

class NavigationHandler implements DashboardComponent {
    private navItems: NodeListOf<HTMLElement>;

    constructor() {
        this.navItems = document.querySelectorAll('.nav-item');
    }

    initialize(): void {
        this.navItems.forEach(item => {
            item.addEventListener('click', (e: Event) => {
                e.preventDefault();
                this.handleNavClick(item);
            });
        });
    }

    private handleNavClick(clickedItem: HTMLElement): void {
        this.navItems.forEach(item => {
            item.classList.remove('active');
        });
        clickedItem.classList.add('active');
        console.log('Navigation clicked:', clickedItem.textContent?.trim());
    }
}

class TabHandler implements DashboardComponent {
    private tabs: NodeListOf<HTMLElement>;

    constructor() {
        this.tabs = document.querySelectorAll('.tab');
    }

    initialize(): void {
        this.tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.handleTabClick(tab);
            });
        });
    }

    private handleTabClick(clickedTab: HTMLElement): void {
        this.tabs.forEach(tab => {
            tab.classList.remove('active');
        });
        clickedTab.classList.add('active');
        
        const tabName = clickedTab.textContent?.trim();
        console.log('Tab switched to:', tabName);
    }
}

class TableHandler implements DashboardComponent {
    private tableRows: NodeListOf<HTMLElement>;

    constructor() {
        this.tableRows = document.querySelectorAll('.data-rows tr');
    }

    initialize(): void {
        this.tableRows.forEach(row => {
            row.addEventListener('click', () => {
                this.handleRowClick(row);
            });
        });
    }

    private handleRowClick(row: HTMLElement): void {
        // Remove any existing selection
        this.tableRows.forEach(r => r.classList.remove('selected'));
        // Add selection to clicked row
        row.classList.add('selected');
        console.log('Student row clicked:', row.textContent?.trim());
    }
}

class ActionButtonHandler implements DashboardComponent {
    private actionButtons: NodeListOf<HTMLElement>;
    private bottomActions: NodeListOf<HTMLElement>;

    constructor() {
        this.actionButtons = document.querySelectorAll('.action-btn');
        this.bottomActions = document.querySelectorAll('.action-button');
    }

    initialize(): void {
        this.actionButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.textContent?.trim();
                console.log('Action clicked:', action);
            });
        });

        this.bottomActions.forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.textContent?.trim();
                console.log('Bottom action clicked:', action);
            });
        });
    }
}

class FilterHandler implements DashboardComponent {
    private filterInputs: NodeListOf<HTMLInputElement>;
    private filterSelects: NodeListOf<HTMLSelectElement>;

    constructor() {
        this.filterInputs = document.querySelectorAll('.filter-input');
        this.filterSelects = document.querySelectorAll('.filter-select');
    }

    initialize(): void {
        this.filterInputs.forEach(input => {
            input.addEventListener('input', () => {
                this.handleFilter();
            });
        });

        this.filterSelects.forEach(select => {
            select.addEventListener('change', () => {
                this.handleFilter();
            });
        });
    }

    private handleFilter(): void {
        console.log('Filter applied');
        // Placeholder for filter functionality
    }
}

class Dashboard {
    private components: DashboardComponent[];

    constructor() {
        this.components = [
            new NavigationHandler(),
            new TabHandler(),
            new TableHandler(),
            new ActionButtonHandler(),
            new FilterHandler()
        ];
    }

    public initialize(): void {
        console.log('Initializing Pastoral Care System...');
        this.components.forEach(component => {
            component.initialize();
        });
        console.log('Pastoral Care System initialized successfully!');
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new Dashboard();
    dashboard.initialize();
});
