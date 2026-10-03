import { test, expect } from '@playwright/test';

test.describe('Tabspace Guitar Platform', () => {
	test('homepage loads with clean SaaS hero, search, and curated songs', async ({ page }) => {
		await page.goto('/');

		// Check branding and title
		await expect(page.locator('h1')).toContainText('Guitar tabs without the clutter');
		await expect(page.locator('input[type="text"]')).toBeVisible();

		// Check curated beginner section
		await expect(page.locator('text=Essential Beginner Songs')).toBeVisible();
		await expect(page.locator('text=Wonderwall').first()).toBeVisible();

		// Test Dark/Light mode toggle
		const themeToggle = page.locator('button[aria-label="Toggle theme"]');
		await expect(themeToggle).toBeVisible();

		const html = page.locator('html');
		const initiallyDark = await html.evaluate((el) => el.classList.contains('dark'));

		// Toggle theme
		await themeToggle.click();
		if (initiallyDark) {
			await expect(html).not.toHaveClass(/dark/);
			await themeToggle.click();
			await expect(html).toHaveClass(/dark/);
		} else {
			await expect(html).toHaveClass(/dark/);
			await themeToggle.click();
			await expect(html).not.toHaveClass(/dark/);
		}
	});

	test('search functionality finds songs and navigates with clean internal ID', async ({ page }) => {
		await page.goto('/');

		const searchInput = page.locator('input[placeholder*="Search by song"]');
		await searchInput.fill('Wonderwall');
		await expect(searchInput).toHaveValue('Wonderwall');
		await page.locator('button:has-text("Search")').click();

		// Wait for search results
		await expect(page.locator('text=Results for "Wonderwall"')).toBeVisible({ timeout: 10000 });
		const firstResult = page.locator('button:has-text("Wonderwall")').first();
		await expect(firstResult).toBeVisible();

		// Click the result and ensure URL is an internal clean ID, not an external URL
		await firstResult.click();
		await expect(page).toHaveURL(/\/tab\/ug--/);
		expect(page.url()).not.toContain('ultimate-guitar.com');
		expect(page.url()).not.toContain('http%3A');
	});

	test('tab view displays chords, transposing, capo, controls, and version swapping', async ({ page }) => {
		// Clean internal Tabspace ID
		const tabId = 'ug--oasis--wonderwall-chords-6125';
		await page.goto(`/tab/${tabId}`);

		// Check title & artist
		await expect(page.locator('h1')).toContainText('Wonderwall');
		await expect(page.locator('text=Oasis').first()).toBeVisible();

		// Check lyrics are present in hybrid view
		await expect(page.locator('.chord-lyric-row', { hasText: 'Today is' }).first()).toBeVisible();

		// Check controls bar
		await expect(page.locator('text=Transpose')).toBeVisible();
		await expect(page.locator('text=Capo')).toBeVisible();

		// Test Transposition: click + button
		const transposePlus = page.locator('button[title="Transpose up 1 semitone"]');
		await transposePlus.click();

		// Transposition badge should update to +1
		await expect(page.locator('text=+1')).toBeVisible();

		// Test Font Sizing: click A+
		const fontPlus = page.locator('button[title="Increase font size"]');
		await fontPlus.click();
		await expect(page.locator('text=110%')).toBeVisible();

		// Test Layout Switching: click Monospace
		const monospaceBtn = page.locator('button:has-text("Monospace")');
		await monospaceBtn.click();
		await expect(monospaceBtn).toHaveClass(/font-semibold/);
		await expect(page.locator('.chord-line').first()).toBeVisible();
		await expect(page.locator('.lyric-line').first()).toBeVisible();

		// Switch back to Hybrid
		const hybridBtn = page.locator('button:has-text("Hybrid")');
		await hybridBtn.click();
		await expect(hybridBtn).toHaveClass(/font-semibold/);

		// Test Chord Popover: click on a chord badge
		const chordBadge = page.locator('button.chord-badge').first();
		await chordBadge.click();
		await expect(page.locator('button[aria-label="Close"]')).toBeVisible();

		// Test Auto-Scroll speed presets
		await expect(page.locator('button[aria-label="Start auto-scroll"]')).toBeVisible();
		const slowDown = page.locator('button[aria-label="Slow down"]');
		await slowDown.click();
		await expect(page.locator('text=0.75x')).toBeVisible();
		await slowDown.click();
		await expect(page.locator('text=0.5x')).toBeVisible();

		// Test Version Swapping: verify version buttons exist and switch versions
		const versionLinks = page.locator('a[title*="Version"]');
		const versionCount = await versionLinks.count();
		expect(versionCount).toBeGreaterThan(1);

		// Click Version 2
		const v2Link = page.locator('a[title*="Version 2"]').first();
		await v2Link.click();
		await expect(page).toHaveURL(/\/tab\/ug--/);
		await expect(page.locator('h1')).toContainText('Wonderwall');
	});

	test('legacy redirect forwards external URLs to internal IDs', async ({ page }) => {
		const legacyUrl = encodeURIComponent('https://tabs.ultimate-guitar.com/tab/oasis/wonderwall-chords-6125');
		await page.goto(`/tab?url=${legacyUrl}`);

		// Should redirect to clean path
		await expect(page).toHaveURL(/\/tab\/ug--oasis--wonderwall-chords-6125/);
	});

	test('self-healing 404 auto-recovers to active canonical tab', async ({ page }) => {
		// Visit the mistyped/outdated ID reported by user
		await page.goto('/tab/ug--vance-joy--riptide-chords-1239339');

		// Server should automatically 307-redirect to the working canonical version
		await expect(page).toHaveURL(/\/tab\/ug--vance-joy--riptide-chords-1237247/);
		await expect(page.locator('h1')).toContainText('Riptide');
		await expect(page.locator('text=Vance Joy').first()).toBeVisible();
	});

	test('artist page displays songs ranked by popularity with filters and search', async ({ page }) => {
		await page.goto('/artist/oasis');

		// Header checks
		await expect(page.locator('h1')).toContainText('Oasis');
		await expect(page.locator('text=Popularity Ordered')).toBeVisible();

		// Check top ranked song
		await expect(page.locator('text=Wonderwall').first()).toBeVisible();

		// Check filter input works
		const filterInput = page.locator('input[placeholder*="Filter Oasis songs"]');
		await filterInput.fill('Anger');
		await expect(page.locator('text=Dont Look Back In Anger').first()).toBeVisible();
		await expect(page.locator('text=Wonderwall')).not.toBeVisible();

		// Clear filter
		await filterInput.fill('');

		// Clicking a song navigates to tab
		const firstSongLink = page.locator('a[href*="/tab/ug--"]').first();
		await firstSongLink.click();
		await expect(page).toHaveURL(/\/tab\/ug--/);
	});

	test('trending charts page displays Billboard & Global charts with 1-click chords', async ({ page }) => {
		await page.goto('/charts');

		// Hero checks
		await expect(page.locator('h1')).toContainText('Top Trending Songs');
		await expect(page.locator('button:has-text("Billboard Hot 100")')).toBeVisible();
		await expect(page.locator('button:has-text("Global Streaming 50")')).toBeVisible();

		// First track should be visible
		const firstTrack = page.locator('h2').first();
		await expect(firstTrack).toBeVisible();

		// Test switching to Global Streaming tab
		const globalTab = page.locator('button:has-text("Global Streaming 50")');
		await globalTab.click();
		await expect(globalTab).toHaveClass(/font-bold/);

		// Switch back to Billboard
		const billboardTab = page.locator('button:has-text("Billboard Hot 100")');
		await billboardTab.click();
		await expect(billboardTab).toHaveClass(/font-bold/);

		// Click Chords button on first track - should resolve to a valid tab
		const firstChordsBtn = page.locator('a:has-text("Chords")').first();
		await firstChordsBtn.click();
		await expect(page).toHaveURL(/\/tab\/ug--|\/\?q=/);
	});

	test('nonexistent tab renders clean SaaS error page with search bar', async ({ page }) => {
		await page.goto('/tab/ug--totally-bogus-nonexistent-song-999999');

		await expect(page.locator('text=Tab not found')).toBeVisible();
		await expect(page.locator('input[placeholder*="Search song title"]')).toBeVisible();
		await expect(page.locator('a:has-text("Back to Explore")')).toBeVisible();
	});
});
