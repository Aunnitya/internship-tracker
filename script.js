/**
 * Internship Tracker - Main Application Logic
 * 
 * This script handles:
 * 1. Initializing and managing the application state (list of internships).
 * 2. Saving and loading data from Local Storage.
 * 3. Form validation and input sanitization (preventing HTML injection).
 * 4. Rendering applications to the table, including responsive card view helper tags.
 * 5. Managing empty state and application count badge.
 */

// -------------------------------------------------------------
// 1. STATE & INITIALIZATION
// -------------------------------------------------------------

// Try to retrieve applications from Local Storage. If none exist, start with an empty array.
let applications = JSON.parse(localStorage.getItem('internshipApplications')) || [];

// Cache DOM elements for easy access
const form = document.getElementById('applicationForm');
const companyInput = document.getElementById('companyName');
const roleInput = document.getElementById('internshipRole');
const dateInput = document.getElementById('applicationDate');
const statusInput = document.getElementById('applicationStatus');

const trackerBody = document.getElementById('trackerBody');
const trackerTable = document.getElementById('trackerTable');
const emptyState = document.getElementById('emptyState');
const trackerCounter = document.getElementById('trackerCounter');

// Set default date picker value to today's date on page load
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;

    // Initial render of existing data
    renderApplications();
});

// -------------------------------------------------------------
// 2. HELPER FUNCTIONS
// -------------------------------------------------------------

/**
 * Saves the current applications array to Local Storage.
 */
function saveToLocalStorage() {
    localStorage.setItem('internshipApplications', JSON.stringify(applications));
}

/**
 * Escapes special HTML characters to prevent Cross-Site Scripting (XSS).
 * This is crucial when displaying user-entered text on the page.
 */
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, (tag) => {
        const chars = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        };
        return chars[tag] || tag;
    });
}

/**
 * Formats a YYYY-MM-DD date string into a more readable format (e.g., "Oct 12, 2026").
 * This is timezone-safe compared to using native Date object parses directly.
 */
function formatDate(dateString) {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;

    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const formattedMonth = monthNames[monthIndex] || parts[1];
    return `${formattedMonth} ${day}, ${year}`;
}

// -------------------------------------------------------------
// 3. CORE LOGIC: RENDER, ADD, DELETE
// -------------------------------------------------------------

/**
 * Renders the list of applications into the table.
 * Toggles the empty state message and updates the total count indicator.
 */
function renderApplications() {
    // Clear any previous rows in the table
    trackerBody.innerHTML = '';

    // Update the applications count badge
    const count = applications.length;
    trackerCounter.textContent = `${count} ${count === 1 ? 'Application' : 'Applications'}`;

    // If there are no applications, show the empty state and hide the table
    if (count === 0) {
        emptyState.style.display = 'flex';
        trackerTable.style.display = 'none';
        return;
    }

    // Otherwise, show the table and hide the empty state
    emptyState.style.display = 'none';
    trackerTable.style.display = 'table';

    // Loop through each application and build its table row
    applications.forEach((app) => {
        const row = document.createElement('tr');

        // Match status to CSS class for styled badges
        const statusClass = app.status.toLowerCase();
        const formattedDate = formatDate(app.date);

        // Populate row cells. We use data-label attributes so the CSS media query
        // can convert this table into individual card blocks on mobile screens.
        row.innerHTML = `
            <td data-label="Company"><strong>${escapeHTML(app.company)}</strong></td>
            <td data-label="Role">${escapeHTML(app.role)}</td>
            <td data-label="Date Applied">${escapeHTML(formattedDate)}</td>
            <td data-label="Status">
                <span class="badge badge-${statusClass}">${escapeHTML(app.status)}</span>
            </td>
            <td data-label="Actions" class="text-right">
                <button class="btn-delete" title="Delete Application" data-id="${app.id}">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </td>
        `;

        // Attach event listener specifically to the delete button in this row
        const deleteButton = row.querySelector('.btn-delete');
        deleteButton.addEventListener('click', () => {
            deleteApplication(app.id);
        });

        // Append the completed row to the table body
        trackerBody.appendChild(row);
    });
}

/**
 * Handles validation and adds a new application.
 */
function addApplication(event) {
    // Prevent the default browser form submission (page reload)
    event.preventDefault();

    // Reset error visuals on form inputs
    let isFormValid = true;
    const formGroups = form.querySelectorAll('.form-group');
    formGroups.forEach(group => group.classList.remove('invalid'));

    // Trim whitespace from text inputs
    const companyValue = companyInput.value.trim();
    const roleValue = roleInput.value.trim();
    const dateValue = dateInput.value;
    const statusValue = statusInput.value;

    // Validate Company Name
    if (!companyValue) {
        companyInput.parentElement.classList.add('invalid');
        isFormValid = false;
    }

    // Validate Role Name
    if (!roleValue) {
        roleInput.parentElement.classList.add('invalid');
        isFormValid = false;
    }

    // Validate Date input
    if (!dateValue) {
        dateInput.parentElement.classList.add('invalid');
        isFormValid = false;
    }

    // If any input is invalid, stop and do not add the application
    if (!isFormValid) {
        return;
    }

    // Create a new application object with a unique timestamp ID
    const newApplication = {
        id: Date.now(),
        company: companyValue,
        role: roleValue,
        date: dateValue,
        status: statusValue
    };

    // Add new object to state, save it, and re-render
    applications.push(newApplication);
    saveToLocalStorage();
    renderApplications();

    // Reset form inputs and restore default today's date
    form.reset();
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
}

/**
 * Deletes an application based on its unique ID.
 */
function deleteApplication(id) {
    // Confirm delete before proceeding (friendly user experience)
    if (confirm('Are you sure you want to delete this application entry?')) {
        // Filter out the application with matching ID
        applications = applications.filter(app => app.id !== id);

        // Save updated array and refresh UI
        saveToLocalStorage();
        renderApplications();
    }
}

// -------------------------------------------------------------
// 4. EVENT LISTENERS
// -------------------------------------------------------------

// Submit form event listener
form.addEventListener('submit', addApplication);
