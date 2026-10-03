// Theme management state for Tabspace (Dark / Light)

class ThemeManager {
	current = $state<'dark' | 'light'>('dark');

	constructor() {
		if (typeof window !== 'undefined') {
			const saved = localStorage.getItem('tabspace:theme') as 'dark' | 'light' | null;
			if (saved === 'light' || saved === 'dark') {
				this.current = saved;
			} else {
				this.current = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
			}
			this.apply();
		}
	}

	toggle() {
		this.current = this.current === 'dark' ? 'light' : 'dark';
		if (typeof window !== 'undefined') {
			localStorage.setItem('tabspace:theme', this.current);
			this.apply();
		}
	}

	private apply() {
		if (typeof document === 'undefined') return;
		if (this.current === 'dark') {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	}
}

export const theme = new ThemeManager();
