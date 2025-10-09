import { test, expect } from '@playwright/test';

test.describe('Patient Workflow', () => {
  test('complete patient workflow: login → add patient → schedule appointment → generate invoice → logout', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'doctor@prontivus.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/');
    await expect(page.locator('text=Dashboard')).toBeVisible();

    // Add new patient
    await page.keyboard.press('n'); // Keyboard shortcut
    await expect(page).toHaveURL(/\/patients\?new=true/);
    
    await page.fill('input[name="name"]', 'João da Silva');
    await page.fill('input[name="cpf"]', '123.456.789-00');
    await page.fill('input[name="phone"]', '(11) 98765-4321');
    await page.fill('input[name="email"]', 'joao@example.com');
    await page.click('button:has-text("Save Patient")');
    
    await expect(page.locator('text=Patient created successfully')).toBeVisible();

    // Schedule appointment
    await page.keyboard.press('a'); // Keyboard shortcut
    await expect(page).toHaveURL(/\/appointments\?new=true/);
    
    await page.selectOption('select[name="patient"]', { label: 'João da Silva' });
    await page.fill('input[name="date"]', '2025-11-01');
    await page.fill('input[name="time"]', '10:00');
    await page.click('button:has-text("Schedule")');
    
    await expect(page.locator('text=Appointment scheduled')).toBeVisible();

    // Generate invoice
    await page.click('a[href="/invoices"]');
    await page.click('button:has-text("New Invoice")');
    
    await page.selectOption('select[name="patient"]', { label: 'João da Silva' });
    await page.fill('input[name="amount"]', '250.00');
    await page.click('button:has-text("Generate Invoice")');
    
    await expect(page.locator('text=Invoice created')).toBeVisible();

    // Logout
    await page.click('button:has(svg.lucide-log-out)');
    await expect(page).toHaveURL('/login');
  });

  test('keyboard shortcuts work correctly', async ({ page }) => {
    await page.goto('/');
    
    // Test 'N' shortcut for new patient
    await page.keyboard.press('n');
    await expect(page).toHaveURL(/\/patients\?new=true/);
    
    // Test 'A' shortcut for new appointment
    await page.keyboard.press('a');
    await expect(page).toHaveURL(/\/appointments\?new=true/);
  });

  test('dark mode toggle persists', async ({ page }) => {
    await page.goto('/');
    
    // Toggle dark mode
    await page.click('button:has(svg.lucide-moon)');
    
    // Check if dark class is applied
    await expect(page.locator('html')).toHaveClass(/dark/);
    
    // Reload page
    await page.reload();
    
    // Dark mode should persist
    await expect(page.locator('html')).toHaveClass(/dark/);
  });
});
