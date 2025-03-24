document.addEventListener('DOMContentLoaded', () => {
    console.log('Bookings dashboard loaded');

    let bookings = JSON.parse(localStorage.getItem('bookings')) || [];
    let sortDirection = 1;
    const bookingsTableBody = document.getElementById('bookingsTableBody');
    const upcomingList = document.getElementById('upcomingList');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const serviceFilter = document.getElementById('serviceFilter');
    const statusFilter = document.getElementById('statusFilter');
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    const exportBtn = document.getElementById('exportBtn');
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const adminStatus = document.getElementById('adminStatus');

    // Initial business password and phone
    let businessPassword = localStorage.getItem('businessPassword') || 'grooming123';
    const businessPhone = '07845984597';

    function renderBookings(bookingsToRender) {
        bookingsToRender.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return sortDirection * (dateA - dateB);
        });

        bookingsTableBody.innerHTML = bookingsToRender.map((booking, index) => `
            <tr>
                <td>${booking.name}</td>
                <td>${booking.phone}</td>
                <td>${booking.service}</td>
                <td>${booking.date}</td>
                <td>${booking.status || 'Upcoming'}</td>
                <td>
                    <button class="edit-btn" data-index="${index}">Edit</button>
                    <button class="delete-btn" data-index="${index}">Delete</button>
                    <button class="complete-btn" data-index="${index}">Complete</button>
                </td>
            </tr>
        `).join('');

        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        const upcoming = bookingsToRender.filter(booking => {
            const bookingDate = new Date(booking.date);
            return bookingDate >= today && bookingDate <= nextWeek && (!booking.status || booking.status === 'Upcoming');
        });
        upcomingList.innerHTML = upcoming.length ? upcoming.map(b => `<p>${b.name} - ${b.date} (${b.service})</p>`).join('') : '<p>No upcoming bookings.</p>';
    }

    function filterBookings() {
        const searchTerm = searchInput.value.toLowerCase();
        const service = serviceFilter.value;
        const status = statusFilter.value;

        let filteredBookings = [...bookings];
        if (searchTerm) {
            filteredBookings = filteredBookings.filter(b => b.name.toLowerCase().includes(searchTerm) || b.phone.includes(searchTerm));
        }
        if (service) {
            filteredBookings = filteredBookings.filter(b => b.service === service);
        }
        if (status) {
            filteredBookings = filteredBookings.filter(b => b.status === status);
        }
        renderBookings(filteredBookings);
    }

    // Initial render (after password validation removes blur)
    renderBookings(bookings);

    // Sort by date
    document.querySelector('.sortable').addEventListener('click', () => {
        sortDirection = -sortDirection;
        renderBookings(bookings);
        document.querySelector('.sort-icon').textContent = sortDirection === 1 ? '↑' : '↓';
    });

    // Search and Filter
    searchBtn.addEventListener('click', filterBookings);
    applyFiltersBtn.addEventListener('click', filterBookings);
    resetFiltersBtn.addEventListener('click', () => {
        searchInput.value = '';
        serviceFilter.value = '';
        statusFilter.value = '';
        renderBookings(bookings);
    });

    // Change Password
    changePasswordBtn.addEventListener('click', () => {
        const enteredPhone = prompt('Enter your phone number to verify:')?.trim();
        if (enteredPhone === null) return;
        if (enteredPhone === businessPhone) {
            const newPassword = prompt('Enter your new password:')?.trim();
            if (newPassword === null) return;
            if (newPassword) {
                businessPassword = newPassword;
                localStorage.setItem('businessPassword', newPassword);
                adminStatus.textContent = 'Password updated successfully!';
                adminStatus.style.color = '#28a745';
                setTimeout(() => adminStatus.textContent = '', 3000);
            } else {
                adminStatus.textContent = 'Password cannot be empty.';
                adminStatus.style.color = '#e64356';
            }
        } else {
            adminStatus.textContent = 'Incorrect phone number.';
            adminStatus.style.color = '#e64356';
        }
    });

    // Export to CSV
    exportBtn.addEventListener('click', () => {
        const csv = 'Name,Phone,Service,Date,Status\n' + bookings.map(b => `${b.name},${b.phone},${b.service},${b.date},${b.status || 'Upcoming'}`).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'bookings.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    });

    // Actions (Edit, Delete, Complete)
    bookingsTableBody.addEventListener('click', e => {
        const index = e.target.dataset.index;
        if (!index) return;

        if (e.target.classList.contains('edit-btn')) {
            const newName = prompt('Enter new name:', bookings[index].name);
            if (newName) bookings[index].name = newName;
            const newPhone = prompt('Enter new phone:', bookings[index].phone);
            if (newPhone && /^\d{10}$/.test(newPhone)) bookings[index].phone = newPhone;
            const newDate = prompt('Enter new date (YYYY-MM-DD):', bookings[index].date);
            if (newDate) bookings[index].date = newDate;
            const newService = prompt('Enter new service:', bookings[index].service);
            if (newService) bookings[index].service = newService;
            localStorage.setItem('bookings', JSON.stringify(bookings));
            renderBookings(bookings);
        } else if (e.target.classList.contains('delete-btn')) {
            if (confirm(`Delete booking for ${bookings[index].name}?`)) {
                bookings.splice(index, 1);
                localStorage.setItem('bookings', JSON.stringify(bookings));
                renderBookings(bookings);
            }
        } else if (e.target.classList.contains('complete-btn')) {
            if (confirm(`Mark ${bookings[index].name}'s booking as completed?`)) {
                bookings[index].status = 'Completed';
                localStorage.setItem('bookings', JSON.stringify(bookings));
                renderBookings(bookings);
            }
        }
    });
});